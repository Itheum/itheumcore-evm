//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

library SharedStructs {
    struct DataPack {
        address seller;
        bytes32 dataHash;
        uint256 priceInItheum;
    }

    struct DataNFT {
        uint256 priceInItheum;
        address creator;
        uint8 royaltyInPercent; // 0-100
        bool transferable; // specifies if dataNFT is tradeable at all
        bool secondaryTradeable; // specifies if dataNFT is tradeable via 'safeTransferFrom' (no $ITHEUM token transfers then)
        string uri;
    }
}