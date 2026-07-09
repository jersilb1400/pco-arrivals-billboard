using System;
using com.gracefellowship.Arrivals.Model;
using com.gracefellowship.Arrivals.Services.Dto;
using Rock.Model;

namespace com.gracefellowship.Arrivals.Services
{
    /// <summary>
    /// Implements <see cref="ISessionService"/> on top of <see cref="ArrivalsRepository"/>.
    /// Maps the raw _Session table rows to/from <see cref="SessionDto"/>, and resolves the
    /// "started by" person name for display. The active session is persisted (not in RAM)
    /// so it survives app-pool recycles (.context/DECISIONS.md D5).
    /// </summary>
    public class SessionService : ISessionService
    {
        private readonly ArrivalsRepository _repo;

        public SessionService( ArrivalsRepository repo )
        {
            _repo = repo;
        }

        /// <summary>Returns the active session as a DTO, or null.</summary>
        public SessionDto GetActiveSession()
        {
            var session = _repo.GetActiveSession();
            return session == null ? null : ToDto( session );
        }

        /// <summary>Launches a new active session (deactivates prior + clears its queue).</summary>
        public SessionDto StartSession( int groupTypeId, string groupTypeName, DateTime occurrenceDate, int? startedByPersonAliasId )
        {
            var session = _repo.StartSession( groupTypeId, groupTypeName, occurrenceDate, startedByPersonAliasId );
            return ToDto( session );
        }

        /// <summary>Deactivates the active session.</summary>
        public void EndSession()
        {
            _repo.EndSession();
        }

        /// <summary>True if a session is active.</summary>
        public bool HasActiveSession()
        {
            return _repo.GetActiveSession() != null;
        }

        // ─── Mapping ───────────────────────────────────────────────────────

        /// <summary>
        /// Maps a _Session row to a DTO, resolving the starter's display name (a cheap,
        /// separate read — one PersonAlias→Person lookup). Returns null name if the alias
        /// or person can't be resolved (e.g. system-started).
        /// </summary>
        private SessionDto ToDto( ArrivalsSession session )
        {
            string startedByName = null;
            if ( session.StartedByPersonAliasId.HasValue )
            {
                startedByName = ResolvePersonName( session.StartedByPersonAliasId.Value );
            }

            return new SessionDto
            {
                Id = session.Id,
                GroupTypeId = session.GroupTypeId,
                GroupTypeName = session.GroupTypeName,
                OccurrenceDate = session.OccurrenceDate,
                StartedByName = startedByName,
                StartedDateTime = session.StartedDateTime,
                IsActive = session.IsActive
            };
        }

        /// <summary>Resolves a PersonAliasId to a display name via EF (separate short context).</summary>
        private static string ResolvePersonName( int personAliasId )
        {
            try
            {
                using ( var rockContext = new Rock.Data.RockContext() )
                {
                    var person = new PersonAliasService( rockContext )
                        .Queryable()
                        .Where( pa => pa.Id == personAliasId )
                        .Select( pa => pa.Person )
                        .FirstOrDefault();

                    if ( person == null )
                    {
                        return null;
                    }

                    var first = person.NickName ?? person.FirstName;
                    return string.IsNullOrWhiteSpace( person.LastName )
                        ? first
                        : $"{first} {person.LastName}";
                }
            }
            catch
            {
                // Name resolution is display-only; never let it break the session read.
                return null;
            }
        }
    }
}
