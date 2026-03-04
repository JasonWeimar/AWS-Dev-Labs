export const handler = async (): Promise<{ statusCode: number; body: string }> => {
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, lab: "05", ts: true })
  };
};
