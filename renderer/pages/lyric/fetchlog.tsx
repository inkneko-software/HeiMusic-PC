import { Box, Button, Stack, Typography, Dialog, DialogActions, DialogTitle, DialogContent, TablePagination, TextField, MenuItem, Chip, FormControlLabel, Switch, LinearProgress } from "@mui/material";

import React from "react"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/styles'
import { LyricControllerService, LyricFetchLog, LyricCoverageVo, ApiError } from "@api/codegen";
import { pushToast } from "@components/HeiMusicMainLayout";
import { useRouter } from "next/router";
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';

//拉取结果五态映射；未识别的新值原样展示为默认 Chip，避免后端新增枚举时前端异常
const OUTCOME_META: Record<string, { label: string, color: "success" | "info" | "warning" | "default" | "error" }> = {
    created: { label: "已创建歌词", color: "success" },
    instrumental: { label: "纯音乐", color: "info" },
    not_found: { label: "暂无曲目", color: "warning" },
    skipped: { label: "跳过", color: "default" },
    failed: { label: "失败", color: "error" },
}

//拉取来源映射
const SOURCE_META: Record<string, string> = {
    manual: "手动",
    mq: "后台任务",
}

//格式化时间；空值或解析失败显示占位
const formatTime = (createdAt?: string | null) => {
    if (createdAt === null || createdAt === undefined || createdAt === "") return "—";
    const date = new Date(createdAt);
    return isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-CN", { hour12: false });
}

function LyricFetchLogPage() {
    const router = useRouter();
    const theme = useTheme();
    const [total, setTotal] = React.useState(0);
    const [page, setPage] = React.useState(1);
    const [rowsPerPage, setRowsPerPage] = React.useState(20);
    const [logList, setLogList] = React.useState<LyricFetchLog[]>([]);
    //首次数据返回前置为 false，避免"暂无拉取记录"空态闪现
    const [loaded, setLoaded] = React.useState(false);
    //筛选状态：音乐ID为输入缓冲，回车/失焦提交
    const [musicIdInput, setMusicIdInput] = React.useState("");
    const [outcomeFilter, setOutcomeFilter] = React.useState("");
    //扫描确认对话框
    const [scanDialogOpen, setScanDialogOpen] = React.useState(false);
    const [scanSubmitting, setScanSubmitting] = React.useState(false);
    //自动刷新开关；开启后每 2 秒拉取一次（仅管理账户使用，不做多档间隔）
    const [autoRefresh, setAutoRefresh] = React.useState(false);
    //歌词覆盖率统计；与筛选无关的全局数据，null 表示尚未加载完成
    const [coverage, setCoverage] = React.useState<LyricCoverageVo | null>(null);

    //规范化音乐ID输入：去空格、非法输入视为空
    const normalizeMusicId = (input: string) => {
        const trimmed = input.trim();
        return trimmed !== "" && !isNaN(parseInt(trimmed)) ? String(parseInt(trimmed)) : "";
    }

    //拼接分页与筛选查询串；空筛选不进入 URL
    const buildFetchLogQuery = (targetPage: number, size: number, musicId: string, outcome: string) => {
        let query = `p=${targetPage}&s=${size}`;
        if (musicId !== "") query += `&musicId=${musicId}`;
        if (outcome !== "") query += `&outcome=${outcome}`;
        return query;
    }

    //拉取日志列表；空筛选传 undefined（query 序列化会跳过 undefined 但不会跳过空字符串）
    const loadLogs = (targetPage: number, targetSize: number, musicId: string, outcome: string) => {
        LyricControllerService.fetchLogList(targetPage, targetSize,
            musicId !== "" ? parseInt(musicId) : undefined,
            outcome !== "" ? outcome : undefined)
            .then(res => {
                //Page 模型字段均为可选，取值需兜底
                setTotal(res.data?.total ?? 0);
                setLogList(res.data?.records ?? []);
                setLoaded(true);
            })
            .catch((error: ApiError) => {
                pushToast(error.message)
                setLoaded(true);
            })
    }

    //拉取歌词覆盖率统计；供标题行进度指示展示
    const loadCoverage = () => {
        LyricControllerService.getCoverage()
            .then(res => setCoverage(res.data ?? null))
            .catch((error: ApiError) => pushToast(error.message))
    }

    //按当前 URL 参数重新拉取日志；不重置筛选输入缓冲，避免打断正在输入的内容
    const refreshFromQuery = () => {
        const { p, s, musicId, outcome } = router.query;
        const targetPage = p !== undefined && !isNaN(parseInt(p as string)) ? parseInt(p as string) : 1;
        const targetSize = s !== undefined && !isNaN(parseInt(s as string)) ? parseInt(s as string) : 20;
        loadLogs(targetPage, targetSize,
            normalizeMusicId(musicId !== undefined ? String(musicId) : ""),
            outcome !== undefined ? String(outcome) : "");
    }

    React.useEffect(() => {
        const { p, s, musicId, outcome } = router.query;
        //后端起始页为1；URL 参数缺失或非法时使用默认值
        const targetPage = p !== undefined && !isNaN(parseInt(p as string)) ? parseInt(p as string) : 1;
        const targetSize = s !== undefined && !isNaN(parseInt(s as string)) ? parseInt(s as string) : 20;
        const musicIdStr = musicId !== undefined ? String(musicId) : "";
        const outcomeStr = outcome !== undefined ? String(outcome) : "";
        setPage(targetPage);
        setRowsPerPage(targetSize);
        setMusicIdInput(musicIdStr);
        setOutcomeFilter(outcomeStr);
        loadLogs(targetPage, targetSize, normalizeMusicId(musicIdStr), outcomeStr)
    }, [router.query])

    //定时自动刷新；关闭、翻页或组件卸载时重建/清理定时器
    React.useEffect(() => {
        if (!autoRefresh) return;
        const timer = setInterval(() => {
            refreshFromQuery();
            //覆盖率随自动刷新一并更新，观察扫描拉取进度
            loadCoverage();
        }, 2000);
        return () => clearInterval(timer);
        //refreshFromQuery 每次渲染重建，仅按开关与路由变化重建定时器即可
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoRefresh, router.query])

    //首次进入页面加载覆盖率统计
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => { loadCoverage() }, [])

    //切换自动刷新；开启时立即刷新一次
    const handleAutoRefreshChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAutoRefresh(event.target.checked);
        if (event.target.checked) refreshFromQuery();
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        //分页组件的起始页为0，但后端的起始页为1，手动修正
        router.push(`/lyric/fetchlog?${buildFetchLogQuery(newPage + 1, rowsPerPage, normalizeMusicId(musicIdInput), outcomeFilter)}`)
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        router.push(`/lyric/fetchlog?${buildFetchLogQuery(1, parseInt(event.target.value), normalizeMusicId(musicIdInput), outcomeFilter)}`)
    };

    //回车/失焦提交音乐ID筛选；筛选变化重置回第 1 页
    const applyMusicIdFilter = () => {
        const normalized = normalizeMusicId(musicIdInput);
        if (normalized !== musicIdInput) setMusicIdInput(normalized);
        const target = `/lyric/fetchlog?${buildFetchLogQuery(1, rowsPerPage, normalized, outcomeFilter)}`;
        //与当前地址相同则不重复跳转，避免失焦无变化时重复请求
        if (target !== router.asPath) router.push(target);
    };

    const handleOutcomeFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOutcomeFilter(event.target.value);
        //筛选变化固定重置回第 1 页
        router.push(`/lyric/fetchlog?${buildFetchLogQuery(1, rowsPerPage, normalizeMusicId(musicIdInput), event.target.value)}`)
    };

    //提交扫描缺失歌词请求；请求期间禁用按钮防重复触发
    const handleScanMissingLyric = () => {
        setScanSubmitting(true);
        LyricControllerService.scanMissingLyric()
            .then(res => {
                //data 为本次入队音乐数；后端未返回数量时降级文案
                const count = typeof res.data === "number" ? res.data : null;
                pushToast(count !== null ? `已提交扫描请求，共 ${count} 首待拉取` : "已提交扫描请求", "success")
                setScanDialogOpen(false)
                //提交扫描后立即刷新覆盖率，后续进度依赖自动刷新
                loadCoverage()
            })
            .catch((error: ApiError) => {
                pushToast(error.message)
            })
            .finally(() => setScanSubmitting(false))
    };

    //覆盖率展示值：百分比取整，总数为零时进度条置 0 防止 NaN
    const totalMusicCount = coverage?.totalMusicCount ?? 0;
    const lyricMusicCount = coverage?.lyricMusicCount ?? 0;
    const coveragePercent = totalMusicCount > 0 ? Math.round(lyricMusicCount / totalMusicCount * 100) : 0;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }} >
            <Box sx={{ position: "sticky", top: '0' }}>
                <Stack direction="row" sx={{ flex: "0 0 auto" }}>
                    <Typography variant='h5' sx={{ margin: "auto 0px auto 12px" }}>歌词拉取</Typography>
                    <Button sx={{ margin: "auto 6px auto 12px" }} color="info" startIcon={<AutorenewOutlinedIcon />}
                        onClick={() => setScanDialogOpen(true)}>扫描缺失歌词</Button>
                    {/* 歌词覆盖率进度指示，与"扫描缺失歌词"入口配合观察拉取进度 */}
                    {coverage !== null &&
                        <Stack direction="row" sx={{ margin: "auto 12px auto auto", alignItems: "center", flex: "0 1 260px", minWidth: "140px" }}
                            title={`歌词覆盖 ${lyricMusicCount} / ${totalMusicCount}（${coveragePercent}%）`}>
                            <LinearProgress variant="determinate" value={coveragePercent} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                            <Typography variant="body2" sx={{ marginLeft: "8px", whiteSpace: "nowrap" }}>
                                歌词覆盖 {lyricMusicCount} / {totalMusicCount}
                            </Typography>
                        </Stack>
                    }
                </Stack>
                {/* 筛选栏；分页组件也放本行（自动刷新开关左侧），避免窄窗口下挤压标题行 */}
                <Stack direction="row" sx={{ padding: "4px 12px 8px", flex: "0 0 auto" }}>
                    <TextField
                        size="small"
                        label="音乐ID"
                        sx={{ width: "120px" }}
                        value={musicIdInput}
                        onChange={e => setMusicIdInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') applyMusicIdFilter() }}
                        onBlur={applyMusicIdFilter}
                    />
                    <TextField
                        size="small"
                        select
                        label="拉取结果"
                        sx={{ width: "120px", marginLeft: "8px" }}
                        value={outcomeFilter}
                        onChange={handleOutcomeFilterChange}
                    >
                        <MenuItem value="">全部</MenuItem>
                        {Object.keys(OUTCOME_META).map(key => (
                            <MenuItem key={key} value={key}>{OUTCOME_META[key].label}</MenuItem>
                        ))}
                    </TextField>
                    <TablePagination
                        sx={{ margin: "auto 0px auto auto" }}
                        rowsPerPageOptions={[10, 25, 100]}
                        component="div"
                        count={total}
                        rowsPerPage={rowsPerPage}
                        page={page - 1} //组件起始页数为0
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="每页行数"
                        labelDisplayedRows={({ from, to, count }) => `第${page}页 ${from}-${to} 共 ${count !== -1 ? count : `超过 ${to}`} 条`}
                    />
                    <FormControlLabel
                        sx={{ marginRight: 0 }}
                        control={<Switch size="small" checked={autoRefresh} onChange={handleAutoRefreshChange} />}
                        label="自动刷新"
                    />
                </Stack>
            </Box>
            {/* 表头 */}
            <TableRow sx={{ display: "table" }}>
                <TableCell width="18%">时间</TableCell>
                <TableCell width="10%">音乐ID</TableCell>
                <TableCell width="10%">来源</TableCell>
                <TableCell width="14%">结果</TableCell>
                <TableCell width="48%">详情</TableCell>
            </TableRow>
            {/* 表格 */}
            <TableContainer sx={{ overflowY: "auto", overflowX: "hidden", width: "auto" }}>
                <Table sx={{ tableLayout: 'fixed', margin: "0px 6px", ".MuiTableCell-root": { padding: "10px 16px" } }} >
                    <TableBody >
                        {
                            logList.map((log, index) => {
                                const outcomeMeta = log.outcome !== undefined ? OUTCOME_META[log.outcome] : undefined;
                                return (
                                    <TableRow
                                        key={log.id ?? index}
                                        sx={{ ':hover': { background: theme.palette.pannelBackground.main } }}
                                    >
                                        <TableCell sx={{ width: "18%", borderBottom: "unset" }}>
                                            <Typography variant="body2" noWrap>{formatTime(log.createdAt)}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ width: "10%", borderBottom: "unset" }}>
                                            {/* 批量消息解析失败等场景 musicId 为空 */}
                                            <Typography
                                                variant="body2"
                                                noWrap
                                                sx={log.musicId === null || log.musicId === undefined ? { color: theme.palette.text.secondary } : undefined}
                                                title={log.musicId === null || log.musicId === undefined ? "音乐可能已删除" : undefined}
                                            >
                                                {log.musicId ?? "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ width: "10%", borderBottom: "unset" }}>
                                            <Typography variant="body2" noWrap>{log.source !== undefined ? (SOURCE_META[log.source] ?? log.source) : "—"}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ width: "14%", borderBottom: "unset" }}>
                                            <Chip size="small" label={outcomeMeta?.label ?? log.outcome ?? "—"} color={outcomeMeta?.color ?? "default"} />
                                        </TableCell>
                                        <TableCell sx={{ width: "48%", borderBottom: "unset" }}>
                                            <Typography variant="body2" noWrap title={log.detail ?? undefined}>{log.detail ?? "—"}</Typography>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        }
                    </TableBody>
                </Table>
            </TableContainer>
            {loaded && logList.length === 0 &&
                <Typography variant="body2" sx={{ margin: "24px auto", color: theme.palette.text.secondary }}>暂无拉取记录</Typography>
            }
            {/* 扫描缺失歌词确认对话框：防误触 */}
            <Dialog open={scanDialogOpen} onClose={() => setScanDialogOpen(false)}>
                <DialogTitle>确认扫描缺失歌词？</DialogTitle>
                <DialogContent>
                    <Typography>将扫描曲库中缺少歌词的音乐，并提交后台从 LRCLIB 拉取；已有歌词不受影响。</Typography>
                </DialogContent>
                <DialogActions>
                    <Button disabled={scanSubmitting} onClick={handleScanMissingLyric}>确认</Button>
                    <Button disabled={scanSubmitting} onClick={() => setScanDialogOpen(false)}>取消</Button>
                </DialogActions>
            </Dialog>
        </Box >
    )
}

export default LyricFetchLogPage;
