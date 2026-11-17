/** 이미지 검색어 최대 길이 */
export const IMAGE_SEARCH_KEYWORD_MAX_LENGTH = 50;

/**
 * 외부 이미지 주소의 최대 길이. 구글 이미지의 썸네일 주소는 200자 안팎이지만
 * 원본 사이트 주소에는 긴 쿼리가 붙기도 해서 넉넉히 잡음
 */
export const IMAGE_URL_MAX_LENGTH = 4096;

/**
 * 받아올 수 있는 이미지의 최대 크기. 결국 16·32칸으로 줄이므로 큰 사진일 필요가 없고,
 * 서버가 대신 받아오는 동안 메모리를 오래 차지하지 않도록 제한
 */
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

/** 구글 이미지 검색 결과 주소. 행사장에서 누구나 쓰는 화면이므로 세이프서치를 켜 둠 */
export const getImageSearchUrl = (keyword: string) =>
  `https://www.google.com/search?udm=2&safe=active&q=${encodeURIComponent(keyword)}`;
