import { useEffect, useRef, useState } from "react";
import { fetchNewDrawings } from "@/apis";
import { BOARD_DRAWING_LIMIT, BOARD_POLL_INTERVAL } from "@/constants";
import type { BoardDrawing } from "@/types";

/** 보드: 서버에서 받은 첫 목록에서 시작해, 주기적으로 새 그림만 받아 앞에 붙임 (새것부터 정렬) */
export const useBoardDrawings = (initialDrawings: BoardDrawing[]) => {
  const [drawings, setDrawings] = useState(initialDrawings);
  // 간격마다 effect를 다시 걸지 않도록 가장 최근 목록을 ref로 읽음
  const drawingsRef = useRef(drawings);

  useEffect(() => {
    drawingsRef.current = drawings;
  }, [drawings]);

  useEffect(() => {
    // 응답이 늦어 다음 차례와 겹치면 같은 그림을 두 번 받아오므로 이전 요청이 끝날 때까지 건너뜀
    let isFetching = false;

    const poll = async () => {
      // 화면이 꺼져 있거나 다른 탭을 보고 있을 때는 요청하지 않음
      if (isFetching || document.hidden) return;
      isFetching = true;
      try {
        const newDrawings = await fetchNewDrawings(drawingsRef.current[0]?.createdAt);
        if (newDrawings.length === 0) return;

        setDrawings((prev) => {
          // 같은 시각에 저장된 그림은 서버가 다시 보내므로 id로 중복을 거름
          const knownIds = new Set(prev.map(({ id }) => id));
          const added = newDrawings.filter(({ id }) => !knownIds.has(id));
          return added.length === 0 ? prev : [...added, ...prev].slice(0, BOARD_DRAWING_LIMIT);
        });
      } catch (error) {
        // 잠깐 연결이 끊겨도 보드는 띄워 둔 그림을 그대로 보여주고 다음 차례에 다시 시도
        console.error(error);
      } finally {
        isFetching = false;
      }
    };

    const timerId = setInterval(poll, BOARD_POLL_INTERVAL);
    return () => clearInterval(timerId);
  }, []);

  return drawings;
};
