import React, { useEffect, useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { Send28Filled } from "@fluentui/react-icons";
import styles from "./QuestionInput.module.css";
import { Audioconvert } from "../Audioconverter/index";

interface Props {
  disabled: boolean;
  placeholder?: string;
  clearOnSend?: boolean;
  userquestion?: string;
  setQuestion: () => void;
  question: string;
}

export const QuestionInput = ({
  disabled,
  placeholder,
  clearOnSend,
  userquestion,
  setQuestion,
  question,
}: Props) => {
  const [audio, setaudio] = useState<Boolean>(false);


  const sendQuestionDisabled = disabled || !question.trim();

  return (
    <Stack horizontal className={styles.questionInputContainer}>
      <TextField
        className={styles.questionInputTextArea}
        placeholder={audio ? "I'm listening..." : placeholder}
        multiline
        resizable={false}
        borderless
        value={audio ? "I'm listening..." : question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      {/* <div className={styles.questionInputButtonsContainer}>
        <Audioconvert
          setQuestion={setQuestion}
          setaudio={setaudio}
          audio={audio}
        />
      </div> */}
    </Stack>
  );
};
