import { startAISession } from "@/server/aiSession";

/** 시작하기를 누를 때마다 새 세션을 발급해 AI 도안·변환 횟수를 새로 셈 */
export async function POST() {
  try {
    await startAISession();
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "세션을 시작하지 못했습니다." }, { status: 500 });
  }
}
