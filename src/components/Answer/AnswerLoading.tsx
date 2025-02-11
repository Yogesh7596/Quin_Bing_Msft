import { Stack } from "@fluentui/react";
import { animated, useSpring } from "@react-spring/web";

import styles from "./Answer.module.scss";
import { AnswerIcon } from "./AnswerIcon";

export const AnswerLoading = () => {
    const animatedStyles = useSpring({
        from: { opacity: 0 },
        to: { opacity: 1 }
    });

    return (
        <animated.div style={{ ...animatedStyles }}>
            <Stack className={styles.answerContainer} verticalAlign="space-between">
                <AnswerIcon />
                <Stack.Item grow >
                    <span className={styles.answerLoading}>
                        Generating Insights and Plots...
                        <span className={styles.loadingdots} />
                    </span>
                </Stack.Item>
            </Stack>
        </animated.div>
    );
};
