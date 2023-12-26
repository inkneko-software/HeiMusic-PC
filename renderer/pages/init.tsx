import React from 'react'
import { AuthControllerService } from "@api/codegen";
import { Typography, Box, TextField, Button } from "@mui/material";

export default function Init(){
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const handleCreate = (email: string, password: string)=>{
        AuthControllerService.createRootAccount({email: email, password: password});
    }
    return (
        <Box>
            <Typography>设置管理账户</Typography>
            <TextField placeholder='邮箱' value={email} onChange={e=>setEmail(e.target.value)}/>
            <TextField placeholder='密码' type='password' value={password} onChange={e=>setPassword(e.target.value)}/>
            <Button>创建</Button>
        </Box>
    )
}