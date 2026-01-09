# scaffold-eth/scaffold-eth-2 - June 2025

> Generated on Jan 8, 2026, 3:02:27 PM

## Activity Overview

- **Issues Created:** 7
- **Pull Requests Created:** 8

## Summary

### Summary of GitHub Activity for scaffold-eth/scaffold-eth-2 in June 2025

- **Major Features and Improvements:**
  - Added a "not found" page to enhance user experience for non-existent routes (#1120).
  - Introduced parameters `blocksBatchSize` and `toBlock` to the `useScaffoldEventHistory` function for improved flexibility in handling event history (#1118, #1117).
  - Updated `hardhat-deploy` to support the Etherscan v2 API for verification, addressing a naming issue in the environment file (#1116).

- **Notable Bug Fixes:**
  - Resolved multiple bugs including:
    - Header theme application on 404 pages (#1119).
    - Issues with Solidity class recognition based on filename (#1113).
    - Misleading logs in `generateTsAbis.js` (#1112).
    - Various other bugs related to IndexedDB and Next.js errors (#1109, #1107).

- **Overall Themes:**
  - Focus on enhancing user experience through improved error handling and user interface elements.
  - Ongoing efforts to refine the functionality and reliability of the codebase by addressing critical bugs.

## Notable Issues

- ✅ [#1119: bug: Header theme not applied on non-existent routes (404 pages)](https://github.com/scaffold-eth/scaffold-eth-2/issues/1119)
- ✅ [#1115: nit: Etherscan API key naming in the env file](https://github.com/scaffold-eth/scaffold-eth-2/issues/1115)
- ✅ [#1113: bug: Solidity Classes are not found if they don't match the filename](https://github.com/scaffold-eth/scaffold-eth-2/issues/1113)
- ✅ [#1112: bug: `generateTsAbis.js` misleadingly logs successful error response even when no ABIs are generated from `yarn deploy`](https://github.com/scaffold-eth/scaffold-eth-2/issues/1112)
- ✅ [#1110: useScaffoldEventHistory() alchemy block range issue](https://github.com/scaffold-eth/scaffold-eth-2/issues/1110)
- ... and 2 more

## Notable Pull Requests

- 🟣 [#1120: Feat/add not found page](https://github.com/scaffold-eth/scaffold-eth-2/pull/1120) (merged)
- 🟣 [#1118: Add `blocksBatchSize` param to useScaffoldEventHistory](https://github.com/scaffold-eth/scaffold-eth-2/pull/1118) (merged)
- 🟣 [#1117: Add `toBlock` param to useScaffoldEventHistory](https://github.com/scaffold-eth/scaffold-eth-2/pull/1117) (merged)
- 🟣 [#1116: up hardhat-deploy allowing etherscan v2 api for verification ](https://github.com/scaffold-eth/scaffold-eth-2/pull/1116) (merged)
- 🔴 [#1114: init commit on spro branch](https://github.com/scaffold-eth/scaffold-eth-2/pull/1114) (closed)
- ... and 3 more

---

*This report was generated using [gh-history](https://github.com/your-org/gh-history)*