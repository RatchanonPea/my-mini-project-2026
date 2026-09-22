import { HttpInterceptorFn } from '@angular/common/http';

const SKIP = ['/auth/login'];

// Every write is stamped with the logged-in user's id; the API uses it for updated_by (created_at is never editable).
export const auditInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'POST' || SKIP.some((path) => req.url.includes(path))) {
    return next(req);
  }
  const body = req.body;
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return next(req);
  }
  let userId: number | null = null;
  try {
    const parsed = parseInt(JSON.parse(localStorage.getItem('userInfo') ?? '{}')?.user_id, 10);
    userId = Number.isInteger(parsed) ? parsed : null;
  } catch {
    userId = null;
  }
  return next(req.clone({ body: { ...body, updated_by: userId } }));
};
