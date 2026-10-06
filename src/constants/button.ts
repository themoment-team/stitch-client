const BUTTON_BASE_STYLES =
  "flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl font-semibold whitespace-nowrap transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40";

const PRIMARY_COLOR_STYLES =
  "bg-accent text-ink shadow-[5px_5px_10px_var(--accent-dark),-5px_-5px_10px_var(--accent-light)] enabled:active:shadow-[inset_3px_3px_6px_var(--accent-dark),inset_-3px_-3px_6px_var(--accent-light)] disabled:shadow-none";

const SECONDARY_COLOR_STYLES =
  "bg-background text-muted shadow-[5px_5px_10px_var(--neu-dark),-5px_-5px_10px_var(--neu-light)] enabled:hover:text-ink enabled:active:shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)] disabled:shadow-none";

const MEDIUM_SIZE_STYLES = "px-6 py-3 text-base";
const SMALL_SIZE_STYLES = "px-4 py-2 text-sm";

/** 다음, AI로 다듬기, 인쇄하기처럼 화면의 주요 동작 버튼 */
export const PRIMARY_BUTTON_STYLES = `${BUTTON_BASE_STYLES} ${PRIMARY_COLOR_STYLES} ${MEDIUM_SIZE_STYLES}`;

/** 주요 동작 옆에 두는 보조 버튼 */
export const SECONDARY_BUTTON_STYLES = `${BUTTON_BASE_STYLES} ${SECONDARY_COLOR_STYLES} ${MEDIUM_SIZE_STYLES}`;

/** 입력칸 옆이나 도안 보이기·지우기처럼 작은 자리에 두는 버튼 */
export const SMALL_PRIMARY_BUTTON_STYLES = `${BUTTON_BASE_STYLES} ${PRIMARY_COLOR_STYLES} ${SMALL_SIZE_STYLES}`;
export const SMALL_SECONDARY_BUTTON_STYLES = `${BUTTON_BASE_STYLES} ${SECONDARY_COLOR_STYLES} ${SMALL_SIZE_STYLES}`;
