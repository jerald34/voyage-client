const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DASHBOARD_TIME_ZONE = "Asia/Manila";
const APPROVAL_BLOCKER_PATTERN = /\b(awaiting|pending|requested changes|missing|needs)\b/i;
const DASHBOARD_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: DASHBOARD_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getActiveTrips(trips) {
  return (Array.isArray(trips) ? trips : []).filter((trip) => String(trip?.status ?? "active").toLowerCase() !== "archived");
}

function getDashboardDateParts(date) {
  const parts = DASHBOARD_DATE_FORMATTER.formatToParts(date).reduce((dateParts, part) => {
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      return {
        ...dateParts,
        [part.type]: Number(part.value),
      };
    }

    return dateParts;
  }, {});

  return parts.year && parts.month && parts.day ? parts : null;
}

function isValidCalendarDate(year, month, day) {
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function parseDepartureDateParts(departureDate) {
  if (typeof departureDate !== "string") {
    return null;
  }

  const dateOnlyMatch = departureDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const dateParts = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
    };

    return isValidCalendarDate(dateParts.year, dateParts.month, dateParts.day) ? dateParts : null;
  }

  const parsedDate = new Date(departureDate);
  return Number.isNaN(parsedDate.getTime()) ? null : getDashboardDateParts(parsedDate);
}

function getRiskScore(riskLevel) {
  const normalizedRisk = String(riskLevel ?? "").toLowerCase();

  if (normalizedRisk === "high") {
    return 35;
  }

  if (normalizedRisk === "medium") {
    return 20;
  }

  return 0;
}

function getDepartureUrgencyScore(daysUntilDeparture) {
  if (daysUntilDeparture === null) {
    return 0;
  }

  return Math.max(0, 45 - daysUntilDeparture);
}

export function getDaysUntilDeparture(departureDate, referenceDate = new Date()) {
  const departureDateParts = parseDepartureDateParts(departureDate);
  const parsedReferenceDate = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);

  if (!departureDateParts || Number.isNaN(parsedReferenceDate.getTime())) {
    return null;
  }

  const referenceDateParts = getDashboardDateParts(parsedReferenceDate);
  if (!referenceDateParts) {
    return null;
  }

  const departureTimestamp = Date.UTC(departureDateParts.year, departureDateParts.month - 1, departureDateParts.day);
  const referenceTimestamp = Date.UTC(referenceDateParts.year, referenceDateParts.month - 1, referenceDateParts.day);

  return Math.ceil((departureTimestamp - referenceTimestamp) / DAY_IN_MS);
}

export function isApprovalBlocker(trip) {
  const approvalStatus = String(trip?.approvalStatus ?? "");
  return !/^approved$/i.test(approvalStatus.trim()) && APPROVAL_BLOCKER_PATTERN.test(approvalStatus);
}

export function getUrgentDepartures(trips, referenceDate = new Date(), windowDays = 30) {
  return getActiveTrips(trips)
    .map((trip) => ({
      ...trip,
      daysUntilDeparture: getDaysUntilDeparture(trip?.departureDate, referenceDate),
    }))
    .filter((trip) => trip.daysUntilDeparture !== null && trip.daysUntilDeparture >= 0 && trip.daysUntilDeparture <= windowDays)
    .sort((firstTrip, secondTrip) => firstTrip.daysUntilDeparture - secondTrip.daysUntilDeparture);
}

export function getApprovalBlockers(trips) {
  return getActiveTrips(trips).filter(isApprovalBlocker);
}

export function getAgencyPortfolioSummary(trips, referenceDate = new Date()) {
  const activeTrips = getActiveTrips(trips);

  return {
    activeTrips: activeTrips.length,
    departuresIn30Days: getUrgentDepartures(activeTrips, referenceDate).length,
    awaitingApproval: getApprovalBlockers(activeTrips).length,
    atRisk: activeTrips.filter((trip) => ["high", "medium"].includes(String(trip?.riskLevel ?? "").toLowerCase())).length,
  };
}

export function getAgentPriorityQueue(trips, referenceDate = new Date(), limit = 4) {
  return getActiveTrips(trips)
    .map((trip) => {
      const daysUntilDeparture = getDaysUntilDeparture(trip?.departureDate, referenceDate);
      const readinessPercent = Number(trip?.readinessPercent ?? 0);
      const priorityScore =
        getDepartureUrgencyScore(daysUntilDeparture) +
        (isApprovalBlocker(trip) ? 30 : 0) +
        getRiskScore(trip?.riskLevel) +
        Math.max(0, 100 - readinessPercent) / 4;

      return {
        ...trip,
        daysUntilDeparture,
        priorityScore,
      };
    })
    .sort((firstTrip, secondTrip) => {
      if (secondTrip.priorityScore !== firstTrip.priorityScore) {
        return secondTrip.priorityScore - firstTrip.priorityScore;
      }

      return (firstTrip.daysUntilDeparture ?? Number.POSITIVE_INFINITY) - (secondTrip.daysUntilDeparture ?? Number.POSITIVE_INFINITY);
    })
    .slice(0, limit);
}

export function getAgentCommandInsights(trips, referenceDate = new Date()) {
  const summary = getAgencyPortfolioSummary(trips, referenceDate);
  return [
    `${summary.awaitingApproval} approvals blocking production`,
    `${summary.departuresIn30Days} departures inside 30 days`,
    `${summary.atRisk} trips flagged at risk`,
  ];
}
