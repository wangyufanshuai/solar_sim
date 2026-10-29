/** Local presentation only. These transitions never alter selection or catalog data. */
export type PassportSheetM1 = "collapsed" | "half" | "details";
export type PassportViewM1 = "portrait" | "spectrum" | "data";
export type PassportPresentationM1 = Readonly<{
  objectId: string;
  mobile: boolean;
  sheet: PassportSheetM1;
  view: PassportViewM1;
  artExpanded: boolean;
}>;
export type PassportPresentationActionM1 =
  | { type: "selection"; objectId: string; mobile: boolean }
  | { type: "viewport"; mobile: boolean }
  | { type: "sheet"; sheet: PassportSheetM1 }
  | { type: "view"; view: PassportViewM1 }
  | { type: "art"; expanded: boolean }
  | { type: "escape" };

export function initialPassportPresentationM1(objectId: string, mobile: boolean): PassportPresentationM1 {
  return { objectId, mobile, sheet: mobile ? "collapsed" : "half", view: "portrait", artExpanded: false };
}

export function reducePassportPresentationM1(state: PassportPresentationM1, action: PassportPresentationActionM1): PassportPresentationM1 {
  switch (action.type) {
    case "selection":
      return state.objectId === action.objectId ? state : initialPassportPresentationM1(action.objectId, action.mobile);
    case "viewport":
      return state.mobile === action.mobile ? state : { ...state, mobile: action.mobile, sheet: action.mobile ? "collapsed" : "half", artExpanded: false, view: "portrait" };
    case "sheet":
      return { ...state, sheet: !state.mobile && action.sheet === "collapsed" ? "half" : action.sheet,
        ...(action.sheet !== "details" ? { artExpanded: false, view: "portrait" as const } : {}) };
    case "view":
      return { ...state, view: action.view, ...(action.view !== "portrait" ? { sheet: "details" as const, artExpanded: false } : {}) };
    case "art":
      return { ...state, artExpanded: action.expanded, view: "portrait", sheet: action.expanded ? "details" : state.sheet };
    case "escape":
      if (state.artExpanded) return { ...state, artExpanded: false };
      if (state.sheet === "details") return { ...state, sheet: "half", view: "portrait" };
      if (state.mobile && state.sheet === "half") return { ...state, sheet: "collapsed", view: "portrait" };
      return state;
  }
}
