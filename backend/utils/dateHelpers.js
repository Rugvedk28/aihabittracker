import {format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay} from "date-fns";


export const toDateKey = (date) => {
    return format(date, "yyyy-MM-dd");
    }

export const todayKey= () => {
    return toDateKey(new Date());
}
export const last90Days = () => {
    const today = new Date();
    const startDate = subDays(today, 89); // 90 days including today
    return eachDayOfInterval({ start: startDate, end: today }).map(toDateKey);
}

export const currentWeek = () => {
    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday as the first day of the week
    const endDate = endOfWeek(today, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate }).map(toDateKey);
}

export const lastNDays = (n) => {
    const today = new Date();
    const startDate = subDays(today, n - 1); // n days including today
    return eachDayOfInterval({ start: startDate, end: today }).map(toDateKey);
} 

export const calcStreak = (sortedDateKeys) => {
    if (sortedDateKeys.length === 0) return {current: 0, longest: 0};
    const set= new Set(sortedDateKeys);
    const today= todayKey();
    const yesterday= toDateKey(subDays(new Date(), 1));

    let current = 0;
    let cursor = new Date();
    if(!set.has(today) && !set.has(yesterday)) {
        current= 0;
    } else {
        while(set.has(toDateKey(cursor))) {
            current++;
            cursor= subDays(cursor, 1);
        }
    }

    const sortedAsc = [...sortedDateKeys].sort();
    let longest= 0;
    let run=0;
    let prev= null;
    for(const k of sortedAsc) {
        if(prev && isSameDay(new Date(k), subDays(new Date(prev), -1))) {
            run++;
        } else {
            run=1;
        }
        longest= Math.max(longest, run);
        prev= k;
    }

    return {current, longest};

}