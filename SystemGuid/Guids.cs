namespace com.gracefellowship.Arrivals.SystemGuid
{
    /// <summary>
    /// GUIDs that uniquely identify Rock entities registered by this plugin.
    /// These must remain stable across deployments — NEVER change them after first install
    /// (changing them breaks Rock entity resolution on every existing install).
    /// Format: uppercase, canonical 8-4-4-4-12. Generated fresh for this plugin.
    /// </summary>
    public static class BlockType
    {
        /// <summary>Block type for the admin configuration block (launch/clear the active session).</summary>
        public const string ARRIVALS_ADMIN = "26E7519F-8267-404A-8E65-D3B3CF917F83";

        /// <summary>Block type for the public kiosk block (security-code entry).</summary>
        public const string SECURITY_CODE_ENTRY = "7EDD6A48-32B3-46D3-BF31-8ED0226211B0";

        /// <summary>Block type for the public billboard display block.</summary>
        public const string BILLBOARD = "E5656BEB-A35F-4E08-B9CC-C93F9D1EC89D";

        /// <summary>Block type for the location-status overview block.</summary>
        public const string LOCATION_STATUS = "4FABB2E1-FE51-49DC-8C5E-DFD5070A9E9E";
    }

    public static class Page
    {
        /// <summary>Page for the admin block (under Admin Tools > Power Tools).</summary>
        public const string ARRIVALS_ADMIN = "88377393-DF7A-4BD5-9FC4-B347D32B4461";

        /// <summary>Page for the public kiosk. Gate by Rock page security if exposed on untrusted networks.</summary>
        public const string SECURITY_CODE_ENTRY = "333B2B95-D29B-4C18-A3A5-A0571D4EAB23";

        /// <summary>Page for the public billboard display.</summary>
        public const string BILLBOARD = "CB49AFE4-162F-45F0-B657-D3000E01C0B5";

        /// <summary>Page for the location-status overview.</summary>
        public const string LOCATION_STATUS = "271918D1-466E-4C5A-90B9-CDD98D810E5A";
    }

    public static class Block
    {
        /// <summary>Block instance for the admin block on its page.</summary>
        public const string ARRIVALS_ADMIN_INSTANCE = "6B9CE23E-8CE2-48F9-9B3A-04254210E97E";

        /// <summary>Block instance for the kiosk block on its page.</summary>
        public const string SECURITY_CODE_ENTRY_INSTANCE = "B728D43E-2F20-41EF-A274-D1D249E399C0";

        /// <summary>Block instance for the billboard block on its page.</summary>
        public const string BILLBOARD_INSTANCE = "E4FD7650-EF6C-4C7A-9E62-5ADA93B81998";

        /// <summary>Block instance for the location-status block on its page.</summary>
        public const string LOCATION_STATUS_INSTANCE = "71E48CCB-1F4E-48E0-B132-13ED3405DC09";
    }
}
