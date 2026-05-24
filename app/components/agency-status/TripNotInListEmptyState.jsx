export default function TripNotInListEmptyState({ ownerName, ownerEmail }) {
  return (
    <div className="mx-auto mt-24 max-w-md px-6 text-center">
      <p className="text-sm text-white/55">
        This trip isn&apos;t on your list.
        {ownerName ? (
          <>
            {" "}Ask <span className="text-white/85">{ownerName}</span> if you should be assigned.
          </>
        ) : null}
      </p>
      {ownerEmail && (
        <a
          href={`mailto:${ownerEmail}`}
          className="mt-3 inline-block text-sm text-white/85 underline-offset-4 hover:underline"
        >
          {ownerEmail}
        </a>
      )}
    </div>
  );
}
