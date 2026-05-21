export interface LogEntry {
  id: number;
  time: string;
  name: string;
  status: string;
  userId: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
}