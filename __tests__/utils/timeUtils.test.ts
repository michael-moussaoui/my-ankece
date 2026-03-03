/* eslint-env jest */
import {
    formatDuration,
    formatDurationLong,
    millisecondsToSeconds,
    secondsToMilliseconds
} from '@/utils/timeUtils';

describe('timeUtils', () => {
    describe('formatDuration', () => {
        it('should format 0 milliseconds', () => {
            expect(formatDuration(0)).toBe('0:00');
        });

        it('should format seconds only', () => {
            expect(formatDuration(5000)).toBe('0:05');
            expect(formatDuration(30000)).toBe('0:30');
            expect(formatDuration(59000)).toBe('0:59');
        });

        it('should format minutes and seconds', () => {
            expect(formatDuration(60000)).toBe('1:00');
            expect(formatDuration(125000)).toBe('2:05');
            expect(formatDuration(599000)).toBe('9:59');
        });

        it('should format long durations', () => {
            expect(formatDuration(600000)).toBe('10:00');
            expect(formatDuration(3661000)).toBe('61:01');
        });

        it('should handle null and undefined', () => {
            expect(formatDuration(null)).toBe('0:00');
            expect(formatDuration(undefined)).toBe('0:00');
        });

        it('should handle negative values', () => {
            expect(formatDuration(-1000)).toBe('0:00');
        });
    });

    describe('formatDurationLong', () => {
        it('should format without hours', () => {
            expect(formatDurationLong(125000)).toBe('2:05');
        });

        it('should format with hours', () => {
            expect(formatDurationLong(3661000)).toBe('1:01:01');
            expect(formatDurationLong(7200000)).toBe('2:00:00');
        });

        it('should handle null and undefined', () => {
            expect(formatDurationLong(null)).toBe('0:00:00');
            expect(formatDurationLong(undefined)).toBe('0:00:00');
        });
    });

    describe('secondsToMilliseconds', () => {
        it('should convert seconds to milliseconds', () => {
            expect(secondsToMilliseconds(1)).toBe(1000);
            expect(secondsToMilliseconds(60)).toBe(60000);
            expect(secondsToMilliseconds(0)).toBe(0);
        });
    });

    describe('millisecondsToSeconds', () => {
        it('should convert milliseconds to seconds', () => {
            expect(millisecondsToSeconds(1000)).toBe(1);
            expect(millisecondsToSeconds(60000)).toBe(60);
            expect(millisecondsToSeconds(1500)).toBe(1);
            expect(millisecondsToSeconds(0)).toBe(0);
        });
    });
});