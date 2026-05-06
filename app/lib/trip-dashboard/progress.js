export function getDayProgress(day) {
  const locations = Array.isArray(day?.locations) ? day.locations : [];
  const totalCount = locations.length;
  const completedCount = locations.filter((location) => location?.completed === true).length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    totalCount,
    percent,
    isComplete: totalCount > 0 && completedCount === totalCount,
    isEmpty: totalCount === 0,
  };
}

function isPlaceholderDay(day) {
  return day?.isPlaceholder === true;
}

export function getTripProgress(days) {
  const safeDays = Array.isArray(days) ? days : [];

  const totals = safeDays.reduce(
    (accumulator, day) => {
      if (day?.isPlaceholder === true) {
        return accumulator;
      }

      const progress = getDayProgress(day);

      return {
        completedCount: accumulator.completedCount + progress.completedCount,
        totalCount: accumulator.totalCount + progress.totalCount,
        completedDays: accumulator.completedDays + (progress.isComplete ? 1 : 0),
        totalDays: accumulator.totalDays + 1,
      };
    },
    {
      completedCount: 0,
      totalCount: 0,
      completedDays: 0,
      totalDays: 0,
    },
  );

  return {
    completedCount: totals.completedCount,
    totalCount: totals.totalCount,
    percent: totals.totalCount === 0 ? 0 : Math.round((totals.completedCount / totals.totalCount) * 100),
    completedDays: totals.completedDays,
    totalDays: totals.totalDays,
  };
}
