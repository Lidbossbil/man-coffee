export function fmt(n) {
  return new Intl.NumberFormat('vi-VN').format(n || 0) + ' đ';
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function tableTotal(tb) {
  return (tb.items || []).reduce((s, it) => s + it.qty * it.price, 0);
}

export function tableRemaining(tb) {
  return tableTotal(tb) - (tb.paidAmount || 0);
}
