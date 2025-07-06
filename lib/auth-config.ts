export const auth0Config = {
  domain: 'school-timetable.jp.auth0.com',
  clientId: 'YmQjwwCNctZZpYm93DDVWUxAV5Hbpkja',
  audience: 'https://api.school-timetable.app',
  redirectUri: process.env.NODE_ENV === 'production' 
    ? 'https://master.school-timetable-frontend.pages.dev/callback'
    : 'http://localhost:3000/callback',
  namespace: 'https://school-timetable.app/'
}

export const userRoles = {
  super_admin: ['*'],
  school_admin: [
    'schools:read', 'schools:write',
    'classes:read', 'classes:write',
    'teachers:read', 'teachers:write',
    'subjects:read', 'subjects:write',
    'classrooms:read', 'classrooms:write',
    'timetables:read', 'timetables:write', 'timetables:generate',
    'constraints:read', 'constraints:write',
    'users:read', 'users:write'
  ],
  teacher: [
    'schools:read', 'classes:read', 'teachers:read',
    'subjects:read', 'classrooms:read', 'timetables:read',
    'constraints:read'
  ],
  viewer: [
    'schools:read', 'classes:read', 'teachers:read',
    'subjects:read', 'classrooms:read', 'timetables:read'
  ]
} as const

export type UserRole = keyof typeof userRoles
export type Permission = string