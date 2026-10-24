export const ok = (res, message, data, status = 200) => res.status(status).json({ message, data });
export const created = (res, message, data) => ok(res, message, data, 201);
