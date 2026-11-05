# Housebets · Matchday Board

Fresh Expo Web prototype built with PanelUI's web components. PanelUI's documentation says its React Native components are for Expo, but do not run in a browser yet; the web target therefore uses the official `panelui-web` collection inside Expo's Metro web export.

## Run and build

```bash
npm install
npm run web
npm run build:web
```

The static site is written to `dist/`; deployment should target only that directory, never the project root.

## Demo paths

- Sports home, Live, Football, Match centre, and the combined Bet slip + My bets screen are reachable from the desktop rail or mobile bottom navigation.
- Choose an odds tile to add a single. Use the sandbox controls to move odds (acceptance required), suspend/resume a market, queue a failed placement, place a demo bet, settle an open sample, or cash out a sample.
- Every fixture, team, score, price, stake, return, and history entry is fictional. Stakes are demo points; nothing uses an account or real money.

No multis, accumulator, bet builder, player data, promos, stats widgets, or match trackers are included.

## PanelUI compatibility sources

- [PanelUI GitHub repository](https://github.com/panel-ui/PanelUI) identifies `panelui-native` for Expo/React Native and `panelui-web` as a separate React web collection.
- [PanelUI Studio overview](https://panelui.dev/docs/studio) explicitly states that PanelUI's React Native components do not run in a browser yet, although the Studio SDK itself supports Expo Web.
- [PanelUI Web installation](https://panelui.dev/docs/web/installation) documents `panelui-web`, React 18+, Tailwind CSS 4, and scanning the package with `@source`.
- [PanelUI Expo installation](https://panelui.dev/docs/installation) documents Expo SDK 57/58 and Node 20+ for the native library.
