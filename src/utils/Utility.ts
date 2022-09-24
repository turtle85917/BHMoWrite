export const TIMEZONE_OFFSET = new Date().getTimezoneOffset() * 60000;

/**
 * 주어진 수가 0보다 크면 + 기호를 붙여 반환한다.
 * 
 * @param value 대상.
 */
 export function toSignedString(value: number): string{
    return (value > 0 ? "+" : "") + value;
}

/**
 * 띄어쓰기를 입력하기 위해 "로 감싸져 있는 얘들을 위해 만든 함수.
 */
 export function getArgs(input: string): string[] {
    let marks: string[] = input.match(/"(.*?)"/g);
    let numObj: { [x in number]: string } = {};

    let cnt = 0;
    let result: string[] = [];

    marks?.map(mk => {
        let replace = input.replace(mk, "T" + cnt.toString());
        numObj[replace.split(" ").indexOf("T" + cnt.toString())] = mk;
        input = replace; cnt++;
    });

    result = input.split(/ +/g);
    for (const [k, v] of Object.entries(numObj)) {
        result[k] = v.replace(/"/g, "");
    }

    return result;
}

/**
 * 게이지 바를 만드는 함수.
 */
export function getBar(data: { current: number; maximum: number; length: number; color: string; }): string {
    let percent = data.current / data.maximum;
    let progress = Math.floor(percent * data.length);

    let valid = Array(progress).fill(data.color).join("");
    let expire = Array(data.length - progress).fill("⬛").join("");

    return valid + expire;
}

/**
 * 텍스트에다가 테두리를 붙힘.
 */
export function mergeBorder(input: string, text: string): string {
    return text.split("")[0] + input + text.split("")[1];
}