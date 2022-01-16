import { useState, ComponentProps } from "react";

export function InvestigateInputEvent() {
  const [eventState, setEventState] = useState<InputEvent | null>(null);
  const preText =
    eventState !== null
      ? JSON.stringify(
          {
            data: eventState.data,
            inputType: eventState.inputType,
          },
          null,
          2
        )
      : "null";

  return (
    <>
      <BasicContentEditableDiv
        onInput={(e) => {
          console.log(e);
          setEventState(e.nativeEvent as InputEvent);
        }}
      ></BasicContentEditableDiv>
      <pre>lastInputEvent: {preText}</pre>
    </>
  );
}

export function BasicContentEditableDiv(
  props: {
    children?: string;
  } & ComponentProps<"div">
) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      style={{ border: "1px solid black", padding: "1em" }}
      {...props}
    >
      {props.children ?? "I am an editable div"}
    </div>
  );
}
