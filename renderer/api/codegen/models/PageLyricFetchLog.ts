/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { LyricFetchLog } from './LyricFetchLog';
import type { OrderItem } from './OrderItem';

export type PageLyricFetchLog = {
    records?: Array<LyricFetchLog>;
    total?: number;
    size?: number;
    current?: number;
    orders?: Array<OrderItem>;
    optimizeCountSql?: any;
    searchCount?: any;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    /**
     * @deprecated
     */
    pages?: number;
};
