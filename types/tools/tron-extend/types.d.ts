/**
 * Copyright (c) iEXBase. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export interface TRC721TokenResponse {
    "total": number;
    "rangeTotal": number;
    "page_size": number;
    "code": number;
    "data": {
        "token_id": string;
        "owner_address": string;
        "owner_address_tag": string;
        "owner_address_tag_logo": string;
        "token_name": string;
        "token_description": string;
        "token_image": string;
        "token_url": string;
        "token_imageInnerUrl": string;
        "latest_transfer_timestamp": number;
        "transfer_count": number;
        "contract_address": string;
        "holders_count": number;
        "token_level": string;
        "icon_url": string;
        "issue_address": string;
        "symbol": string;
        "token_desc": string;
        "name": string;
        "issue_time": string;
    }[];
}
