/** Fixed-color AI.pm artwork shared by the UI and native asset generator. */
export const AI_PM_MARK_PATH = 'M100 245C150 184 850 184 900 245C962 306 962 718 900 779C850 840 150 840 100 779C38 718 38 306 100 245Z'

/** Standalone vector; brand colors deliberately remain identical in both themes. */
export const AI_PM_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" fill="none">
<defs>
<linearGradient id="rim" x1="170" y1="280" x2="820" y2="760" gradientUnits="userSpaceOnUse"><stop stop-color="#4160ff"/><stop offset=".32" stop-color="#6555e8"/><stop offset=".63" stop-color="#ffe478"/><stop offset="1" stop-color="#ff5728"/></linearGradient>
<linearGradient id="spectrum" x1="190" y1="280" x2="860" y2="740" gradientUnits="userSpaceOnUse"><stop stop-color="#218fff"/><stop offset=".27" stop-color="#12d4f2"/><stop offset=".58" stop-color="#a478ad"/><stop offset="1" stop-color="#ff5a2b"/></linearGradient>
<linearGradient id="screen" x1="310" y1="250" x2="700" y2="800" gradientUnits="userSpaceOnUse"><stop stop-color="#29243e"/><stop offset="1" stop-color="#201f2a"/></linearGradient>
</defs>
<path d="${AI_PM_MARK_PATH}" fill="url(#rim)"/>
<path d="M100 245C38 306 38 718 100 779C150 840 850 840 900 779L851 742C800 777 211 777 170 732C122 681 122 361 170 302Z" fill="url(#spectrum)"/>
<path d="M174 312C218 272 794 272 838 312C882 353 882 671 838 712C794 752 218 752 174 712C130 671 130 353 174 312Z" fill="url(#screen)"/>
<g id="tray-glyph" fill="#fff"><path d="M294 402H350V622H294Z"/><path d="M685 402L727 444L657 512L727 580L685 622L573 512Z"/></g>
</svg>`

/** Self-contained image URL avoids SVG gradient-id collisions between render occurrences. */
export const AI_PM_MARK_URL = `data:image/svg+xml,${encodeURIComponent(AI_PM_MARK_SVG)}`
