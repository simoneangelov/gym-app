/**
 * Cookie set by "View as a visitor" on the sign-in page. While it is set and nobody is
 * signed in, the app is browsable read-only, showing accounts that opted in with
 * profiles.visible_to_visitors. Row Level Security (not this cookie) is what keeps
 * visitors from writing anything: they use the anon role.
 */
export const VISITOR_COOKIE = "visitor";
