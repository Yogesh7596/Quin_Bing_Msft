import { useRef, useState, useEffect } from "react";
import {
  Checkbox,
  Panel,
  DefaultButton,
  TextField,
  SpinButton,
  Dropdown,
  IDropdownOption,
  ComboBox,
  IComboBox,
} from "@fluentui/react";
import { SparkleFilled } from "@fluentui/react-icons";
import RetravierLogo from "../../assets/Quin_Logo.png";
import styles from "./Chat.module.css";

import {
  chatApi,
  RetrievalMode,
  Approaches,
  AskResponse,
  ChatRequest,
  ChatTurn,
} from "../../api";
import { Answer, AnswerError, AnswerLoading } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { ExampleList } from "../../components/Example";
import { UserChatMessage } from "../../components/UserChatMessage";
import {
  AnalysisPanel,
  AnalysisPanelTabs,
} from "../../components/AnalysisPanel";
import { SettingsButton } from "../../components/SettingsButton";
import { ClearChatButton } from "../../components/ClearChatButton";
import { trackPromise } from "react-promise-tracker";
import categoryService from "../../api/categoryService";
import React from "react";
// import useCredit from "../../contextProviders/creditProvider/useCredit";

const Chat = () => {
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState<string>("");
  const [retrieveCount, setRetrieveCount] = useState<number>(3);
  const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>(
    RetrievalMode.Hybrid
  );
  const [useSemanticRanker, setUseSemanticRanker] = useState<boolean>(false);
  const [useSemanticCaptions, setUseSemanticCaptions] =
    useState<boolean>(false);
  const [useSuggestFollowupQuestions, setUseSuggestFollowupQuestions] =
    useState<boolean>(false);

  const lastQuestionRef = useRef<string>("");
  const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>();

  const [activeCitation, setActiveCitation] = useState<string>();
  const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<
    AnalysisPanelTabs | undefined
  >(undefined);

  const [selectedAnswer, setSelectedAnswer] = useState<number>(0);
  const [answers, setAnswers] = useState<
    [user: string, response: AskResponse][]
  >([]);

  const [categoryList, setcategoryList] = useState<any>([]);
  const [comboBoxOptions, setComboBoxOptions] = useState<any>([]);
  const comboBoxRef = useRef<IComboBox>(null);
  const [excludeCategory, setExcludedCategory] = useState<any>([]);
  // const { creditBalance, setCreditBalance } = useCredit()
  // let excludeCategory : any = [];

  const makeApiRequest = async (question: string) => {
    lastQuestionRef.current = question;
    const excludeResults = excludeCategory.map((cat) => cat.key);
    error && setError(undefined);
    setIsLoading(true);
    setActiveCitation(undefined);
    setActiveAnalysisPanelTab(undefined);

    try {


      // Check if the decrypted balance is sufficient
      if (creditBalance <= 0) {
        // Display an alert indicating insufficient balance
        alert('Insufficient balance. Please recharge your account.');
        return;
      }
      else {
        let email; // Declare the variable

        const storedResponse = localStorage.getItem('msalResponse');
        const parsedResponse = JSON.parse(storedResponse);
        email = parsedResponse.account.username;
        const history: ChatTurn[] = answers.map((a) => ({ user: a[0], bot: a[1].answer }));
        const request: ChatRequest = {
          history: [...history, { user: question, bot: undefined }],
          email: email,
          approach: Approaches.ReadRetrieveRead,
          overrides: {
            promptTemplate: promptTemplate.length === 0 ? undefined : promptTemplate,
            excludeCategory: excludeResults,
            top: retrieveCount,
            retrievalMode: retrievalMode,
            semanticRanker: useSemanticRanker,
            semanticCaptions: useSemanticCaptions,
            suggestFollowupQuestions: useSuggestFollowupQuestions,
          },
        };
        const result = await chatApi(email, request);
        setCreditBalance(result.balance)
        setAnswers([...answers, [question, result]]);
      }

    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };
  const clearChat = () => {
    lastQuestionRef.current = "";
    error && setError(undefined);
    setActiveCitation(undefined);
    setActiveAnalysisPanelTab(undefined);
    setAnswers([]);
  };

  useEffect(
    () => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" }),
    [isLoading]
  );
  useEffect(() => getCategoryList(), []);

  const onPromptTemplateChange = (
    _ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => {
    setPromptTemplate(newValue || "");
  };

  const onRetrieveCountChange = (
    _ev?: React.SyntheticEvent<HTMLElement, Event>,
    newValue?: string
  ) => {
    setRetrieveCount(parseInt(newValue || "3"));
  };

  const onRetrievalModeChange = (
    _ev: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption<RetrievalMode> | undefined,
    index?: number | undefined
  ) => {
    setRetrievalMode(option?.data || RetrievalMode.Hybrid);
  };

  const onUseSemanticRankerChange = (
    _ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    checked?: boolean
  ) => {
    setUseSemanticRanker(!!checked);
  };

  const onUseSemanticCaptionsChange = (
    _ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    checked?: boolean
  ) => {
    setUseSemanticCaptions(!!checked);
  };

  const onUseSuggestFollowupQuestionsChange = (
    _ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    checked?: boolean
  ) => {
    setUseSuggestFollowupQuestions(!!checked);
  };

  const onExampleClicked = (example: string) => {
    makeApiRequest(example);
  };

  const onShowCitation = (citation: string, index: number) => {
    if (
      activeCitation === citation &&
      activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab &&
      selectedAnswer === index
    ) {
      setActiveAnalysisPanelTab(undefined);
    } else {
      setActiveCitation(citation);
      setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
    }

    setSelectedAnswer(index);
  };

  const onToggleTab = (tab: AnalysisPanelTabs, index: number) => {
    if (activeAnalysisPanelTab === tab && selectedAnswer === index) {
      setActiveAnalysisPanelTab(undefined);
    } else {
      setActiveAnalysisPanelTab(tab);
    }

    setSelectedAnswer(index);
  };

  const getCategoryList = () => {
    trackPromise(
      categoryService.getCategory({ status_flag: 1 }).then((res) => {
        let existingCategory = [];
        let catergoryList2 = [...res?.data?.CategoryList];
        setcategoryList(catergoryList2);
        let comboboxoptions: any = [];
        catergoryList2.forEach((category) => {
          comboboxoptions.push({
            key: category.id,
            text: category.category_name,
          });
        });
        setComboBoxOptions(comboboxoptions);
      })
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.commandsContainer}>
        <ClearChatButton
          className={styles.commandButton}
          onClick={clearChat}
          disabled={!lastQuestionRef.current || isLoading}
        />
        <SettingsButton
          className={styles.commandButton}
          onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
        />
      </div>
      <div className={styles.chatRoot}>
        <div className={styles.chatContainer}>
          {!lastQuestionRef.current ? (
            <div className={styles.chatEmptyState}>
              <SparkleFilled
                fontSize={"120px"}
                primaryFill={"rgba(115, 118, 225, 1)"}
                aria-hidden="true"
                aria-label="Chat logo"
              />
              <h1 className={styles.chatEmptyStateTitle}>
                Chat with
                <img
                  src={RetravierLogo}
                  className="d-inline-block align-left quin_logo"
                  width="100px"
                />
              </h1>
              {/* <h2 className={styles.chatEmptyStateSubtitle}>
                Ask anything or try an example
              </h2> */}
              <ExampleList onExampleClicked={onExampleClicked} />
            </div>
          ) : (
            <div className={styles.chatMessageStream}>
              {answers.map((answer, index) => (
                <div key={index}>
                  <UserChatMessage message={answer[0]} />
                  <div className={styles.chatMessageGpt}>
                    <Answer
                      key={index}
                      answer={answer[1]}
                      isSelected={
                        selectedAnswer === index &&
                        activeAnalysisPanelTab !== undefined
                      }
                      onCitationClicked={(c) => onShowCitation(c, index)}
                      onThoughtProcessClicked={() =>
                        onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)
                      }
                      onSupportingContentClicked={() =>
                        onToggleTab(
                          AnalysisPanelTabs.SupportingContentTab,
                          index
                        )
                      }
                      onFollowupQuestionClicked={(q) => makeApiRequest(q)}
                      showFollowupQuestions={
                        useSuggestFollowupQuestions &&
                        answers.length - 1 === index
                      }
                      question=""
                      onRefreshedClicked={() => { }}
                    />
                  </div>
                </div>
              ))}
              {isLoading && (
                <>
                  <UserChatMessage message={lastQuestionRef.current} />
                  <div className={styles.chatMessageGptMinWidth}>
                    <AnswerLoading />
                  </div>
                </>
              )}
              {error ? (
                <>
                  <UserChatMessage message={lastQuestionRef.current} />
                  <div className={styles.chatMessageGptMinWidth}>
                    <AnswerError
                      error={error.toString()}
                      onRetry={() => makeApiRequest(lastQuestionRef.current)}
                    />
                  </div>
                </>
              ) : null}
              <div ref={chatMessageStreamEnd} />
            </div>
          )}

          <div className={styles.chatInput}>
            <QuestionInput
              clearOnSend
              placeholder="Type a new question"
              disabled={isLoading}
              onSend={(question) => makeApiRequest(question)}
            />
          </div>
        </div>

        {answers.length > 0 && activeAnalysisPanelTab && (
          <AnalysisPanel
            className={styles.chatAnalysisPanel}
            activeCitation={activeCitation}
            onActiveTabChanged={(x) => onToggleTab(x, selectedAnswer)}
            citationHeight="810px"
            answer={answers[selectedAnswer][1]}
            activeTab={activeAnalysisPanelTab}
          />
        )}

        <Panel
          headerText="Configure answer generation"
          isOpen={isConfigPanelOpen}
          isBlocking={false}
          onDismiss={() => setIsConfigPanelOpen(false)}
          closeButtonAriaLabel="Close"
          onRenderFooterContent={() => (
            <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>
              Close
            </DefaultButton>
          )}
          isFooterAtBottom={true}
        >
          <TextField
            className={styles.chatSettingsSeparator}
            defaultValue={promptTemplate}
            label="Override prompt template"
            multiline
            autoAdjustHeight
            onChange={onPromptTemplateChange}
          />

          <SpinButton
            className={styles.chatSettingsSeparator}
            label="Retrieve this many documents from search:"
            min={1}
            max={50}
            defaultValue={retrieveCount.toString()}
            onChange={onRetrieveCountChange}
          />

          <ComboBox
            ref={comboBoxRef}
            defaultSelectedKey=""
            label="Exclude Categories"
            multiSelect
            options={comboBoxOptions}
            styles={{ root: { maxWidth: 300 } }}
            selectedKey={excludeCategory.map((cat) => cat.key)}
            onChange={(e, o, i, v) => {
              if (o?.selected == true) {
                setExcludedCategory([...excludeCategory, o]);
              } else {
                let newVals = excludeCategory.filter((cat) => cat.key != o?.key)
                setExcludedCategory(newVals);
              }
            }}
          />

          {/* <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSemanticRanker}
                        label="Use semantic ranker for retrieval"
                        onChange={onUseSemanticRankerChange}
                    />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSemanticCaptions}
                        label="Use query-contextual summaries instead of whole documents"
                        onChange={onUseSemanticCaptionsChange}
                        disabled={!useSemanticRanker}
                    /> */}
          <Checkbox
            className={styles.chatSettingsSeparator}
            checked={useSuggestFollowupQuestions}
            label="Suggest follow-up questions"
            onChange={onUseSuggestFollowupQuestionsChange}
          />
          <Dropdown
            className={styles.chatSettingsSeparator}
            label="Retrieval mode"
            options={[
              {
                key: "hybrid",
                text: "Vectors + Text (Hybrid)",
                selected: retrievalMode == RetrievalMode.Hybrid,
                data: RetrievalMode.Hybrid,
              },
              {
                key: "vectors",
                text: "Vectors",
                selected: retrievalMode == RetrievalMode.Vectors,
                data: RetrievalMode.Vectors,
              },
              {
                key: "text",
                text: "Text",
                selected: retrievalMode == RetrievalMode.Text,
                data: RetrievalMode.Text,
              },
            ]}
            required
            onChange={onRetrievalModeChange}
          />
        </Panel>
      </div>
    </div>
  );
};

export default Chat;
