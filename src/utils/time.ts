const pad = (value: number) => String(value).padStart(2, "0");

/** 초를 "m:ss"로 바꿈. 1시간 이상이면 "h:mm:ss" */
export const formatSeconds = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};
