import { TIMEZONE_OFFSET, toSignedString } from "./Utility";

export enum LogColor{
  NORMAL,
  BRIGHT,
  DIM,
  UNDERSCORE = 4,

  F_BLACK = 30,
  F_RED,
  F_GREEN,
  F_YELLOW,
  F_BLUE,
  F_MAGENTA,
  F_CYAN,
  F_WHITE,

  B_BLACK = 40,
  B_RED,
  B_GREEN,
  B_YELLOW,
  B_BLUE,
  B_MAGENTA,
  B_CYAN,
  B_WHITE
}

export enum LogLevel {
  NORMAL,
  INFO,
  SUCCESS,
  WARNING,
  ERROR
}

export class Logger {
  private static readonly REGEXP_ANSI_ESCAPE = /\x1b\[(\d+)m/g;

  private readonly type: LogLevel;
  private readonly list: [string, string][];
  private readonly timestamp: string;

  private head?: string;
  private chunk: string[];

  private static getLocalISODate(): string {
    const now = new Date();
    const offset = -Math.round(TIMEZONE_OFFSET / 3600000) || "";

    return new Date(now.getTime() - TIMEZONE_OFFSET).toISOString() + (offset && toSignedString(offset));
  }

  private static escape(style: LogColor[] = LogStyle.NORMAL): string {
    return style.reduce((pv, v) => pv + `\x1b[${v}m`, "");
  }

  public static error(title?: string): Logger {
    return new Logger(LogLevel.ERROR, title);
  }

  public static info(title?: string): Logger {
    return new Logger(LogLevel.INFO, title);
  }

  public static log(title?: string): Logger {
    return new Logger(LogLevel.NORMAL, title);
  }

  public static success(title?: string): Logger {
    return new Logger(LogLevel.SUCCESS, title);
  }

  public static warning(title?: string): Logger {
    return new Logger(LogLevel.WARNING, title);
  }

  constructor(type: LogLevel = LogLevel.NORMAL, title: string = "") {
    this.type = type;

    this.list = [];
    this.timestamp = Logger.getLocalISODate();
    this.chunk = [];
    this.putS(LogStyle.TIMESTAMP, this.timestamp);
    this.putS(LogStyle.CALLER_LINE, " ");

    switch (type) {
      case LogLevel.NORMAL:
        this.putS(LogStyle.TYPE_NORMAL, "(:)");
        this.putS(LogStyle.CALLER_LINE, " ");
        break;
      case LogLevel.INFO:
        this.putS(LogStyle.TYPE_INFO, "(i)");
        this.putS(LogStyle.CALLER_LINE, " ");
        break;
      case LogLevel.SUCCESS:
        this.putS(LogStyle.TYPE_SUCCESS, "(✓)");
        this.putS(LogStyle.CALLER_LINE, " ");
        break;
      case LogLevel.WARNING:
        this.putS(LogStyle.TYPE_WARNING, "(△)");
        this.putS(LogStyle.CALLER_LINE, " ");
        break;
      case LogLevel.ERROR:
        this.putS(LogStyle.TYPE_ERROR, "(×)");
        this.putS(LogStyle.CALLER_LINE, " ");
        break;
    }
    if (title) {
      this.putS(LogStyle.TITLE, title);
    }
    this.putS(LogStyle.CALLER_LINE, " ");
  }

  private getText(): string {
    const maxDigit = this.list.reduce((pv, v) => pv < v[0]?.length ? v[0].length : pv, 1);
    const prefix = " ".repeat(this.timestamp.length + 1);
    const last = this.list.length - 2;

    return [
      this.list[0][1],
      ...this.list.slice(1).map(([ head, body ], i) => {
        return prefix + Logger.escape(LogStyle.LINE) + (i === last ? "└" : "├") + "─ " + (head ?? String(i)).padEnd(maxDigit, " ") + Logger.escape() + ": " + body;
      })
    ].join("\n");
  }

  public out(): void {
    if (this.chunk.length) {
      this.next();
    }

    let text = this.getText();
    let args: string[] = [];

    switch(this.type){
      case LogLevel.NORMAL:
        console.log(text, ...args);
        break;
      case LogLevel.INFO:
      case LogLevel.SUCCESS:
        console.info(text, ...args);
        break;
      case LogLevel.WARNING:
        console.warn(text, ...args);
        break;
      case LogLevel.ERROR:
        console.error(text, ...args);
        break;
    }
  }

  public next(head?: string): this {
    this.list.push([ this.head || "", this.chunk.join("") ]);
    this.head = head;
    this.chunk  = [];
    return this;
  }

  public put(...args: any[]): this {
    this.chunk.push(...args);
    return this;
  }

  public putS(value: LogColor[], ...args: any[]): this {
    this.chunk.push(Logger.escape(value), ...args, Logger.escape());
    return this;
  }
}

/**
 * 로그의 색 조합을 정의하는 유틸리티 클래스.
 */
export class LogStyle {
  public static readonly NORMAL = [ LogColor.NORMAL ];
  
  public static readonly CALLER = [ LogColor.F_CYAN ];
  public static readonly CALLER_PID = [ LogColor.F_MAGENTA ];
  public static readonly CALLER_FILE = [ LogColor.BRIGHT, LogColor.F_CYAN ];
  public static readonly CALLER_LINE = [ LogColor.NORMAL ];
  public static readonly LINE = [ LogColor.BRIGHT ];
  public static readonly METHOD = [ LogColor.F_YELLOW ];
  public static readonly TIMESTAMP = [ LogColor.F_BLUE ];
  public static readonly TARGET = [ LogColor.BRIGHT, LogColor.F_BLUE ];
  public static readonly TITLE = [ LogColor.BRIGHT ];
  public static readonly TYPE_ERROR = [ LogColor.BRIGHT, LogColor.B_RED ];
  public static readonly TYPE_INFO = [ LogColor.B_BLUE ];
  public static readonly TYPE_NORMAL = [ LogColor.BRIGHT ];
  public static readonly TYPE_SUCCESS = [ LogColor.F_BLACK, LogColor.B_GREEN ];
  public static readonly TYPE_WARNING = [ LogColor.F_BLACK, LogColor.B_YELLOW ];
  public static readonly XHR = [ LogColor.F_GREEN ];
}