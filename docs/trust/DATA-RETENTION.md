# Bavio Data Retention Matrix

**Status:** Draft; product/legal configuration required.

| Data | Observed storage/lifecycle | Retention status | Deletion evidence |
|---|---|---|---|
| Account/Workspace | PostgreSQL business and user-related records | No single period established | No complete self-service account deletion flow verified |
| Conversation/Call | `calls`, sessions, transcripts, metadata | No global period established | Targeted record paths exist; full deletion workflow not verified |
| Transcript | `transcripts` and call JSON fields | No global period established | No complete user-facing purge flow verified |
| Recording | Supabase `call-recordings` bucket where used | No global period established | Bucket upload exists; general deletion process not verified |
| TTS audio | Supabase `tts-audio` bucket | Cleanup routine targets files older than 24 hours and call-end files | Targeted storage cleanup functions exist |
| Lead | `leads` table | No global period established | No complete deletion route verified |
| Knowledge | Knowledge tables/storage paths | No global period established | No complete deletion inventory verified |
| ActionExecution/Evidence | PostgreSQL execution tables | No global period established | No general purge policy verified |
| WorkflowExecution | PostgreSQL workflow tables | No global period established | No general purge policy verified |
| Logs | Server/application logs | Provider/host configuration unknown | Operational policy required |

Do not advertise a 30-day, 90-day, indefinite, or other universal period until approved. Requests use `[PRIVACY_EMAIL]`.
