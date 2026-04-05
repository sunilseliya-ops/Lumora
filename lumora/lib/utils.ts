import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'h:mm a');
}

export function getMealEmoji(type: string): string {
  const map: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '⚡',
  };
  return map[type] || '🍽️';
}

export function getMoodColor(mood: string): string {
  const map: Record<string, string> = {
    happy: '#0FCFAD',
    sad: '#7C6AEA',
    anxious: '#F06678',
    calm: '#60A5FA',
    energetic: '#E8A020',
    tired: '#8892A4',
    neutral: '#8892A4',
  };
  return map[mood?.toLowerCase()] || '#8892A4';
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export function calorieColor(cals: number, goal: number): string {
  const pct = cals / goal;
  if (pct < 0.6) return '#0FCFAD';
  if (pct < 0.9) return '#E8A020';
  return '#F06678';
}
