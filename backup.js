/* =========================================================
   Beads Task Local Backup / Resume
========================================================= */

const BEADS_BACKUP_PREFIX =
    "beads_checkpoint_v1_";


let activeBeadsCheckpoint =
    null;


/* =========================================================
   Key
========================================================= */

function beadsBackupKey(subject) {

    return (
        BEADS_BACKUP_PREFIX +
        String(subject).trim()
    );

}


/* =========================================================
   读取
========================================================= */

function getBeadsCheckpoint(subject) {

    try {

        const raw =
            localStorage.getItem(
                beadsBackupKey(subject)
            );


        if (!raw) {

            return null;

        }


        return JSON.parse(raw);

    }
    catch (error) {

        console.error(
            "Failed to read Beads checkpoint:",
            error
        );


        return null;

    }

}


/* =========================================================
   保存
========================================================= */

function saveBeadsCheckpoint() {

    if (
        !activeBeadsCheckpoint
    ) {

        return;

    }


    activeBeadsCheckpoint.updated_at =
        new Date().toISOString();


    try {

        localStorage.setItem(
            beadsBackupKey(
                activeBeadsCheckpoint.subject
            ),
            JSON.stringify(
                activeBeadsCheckpoint
            )
        );

    }
    catch (error) {

        console.error(
            "Failed to save Beads checkpoint:",
            error
        );

    }

}


/* =========================================================
   新任务
========================================================= */

function createNewBeadsCheckpoint(
    subject,
    sessionID
) {

    activeBeadsCheckpoint = {

        version:
            1,

        subject:
            String(subject),

        session_id:
            sessionID,

        experiment_completed:
            false,

        draws:
            [],

        finals:
            [],

        trial_elapsed_ms:
            {},

        created_at:
            new Date().toISOString(),

        updated_at:
            new Date().toISOString()

    };


    saveBeadsCheckpoint();


    return activeBeadsCheckpoint;

}


/* =========================================================
   激活旧记录
========================================================= */

function activateBeadsCheckpoint(
    checkpoint
) {

    activeBeadsCheckpoint =
        checkpoint;


    return activeBeadsCheckpoint;

}


/* =========================================================
   删除
========================================================= */

function clearBeadsCheckpoint(
    subject
) {

    try {

        localStorage.removeItem(
            beadsBackupKey(subject)
        );

    }
    catch (error) {

        console.error(
            "Failed to clear Beads checkpoint:",
            error
        );

    }


    if (
        activeBeadsCheckpoint &&
        activeBeadsCheckpoint.subject ===
            String(subject)
    ) {

        activeBeadsCheckpoint =
            null;

    }

}


/* =========================================================
   保存一颗完整珠子
========================================================= */

function saveBeadsDrawCheckpoint(
    drawData,
    elapsedMs
) {

    if (
        !activeBeadsCheckpoint
    ) {

        return;

    }


    const trial =
        Number(drawData.trial);


    const bead =
        Number(drawData.bead_index);


    const index =
        activeBeadsCheckpoint.draws
            .findIndex(
                function(d) {

                    return (
                        Number(d.trial) ===
                            trial
                        &&
                        Number(d.bead_index) ===
                            bead
                    );

                }
            );


    const savedDraw =
        Object.assign(
            {},
            drawData,
            {
                synced:
                    false
            }
        );


    if (
        index >= 0
    ) {

        /*
            如果原来已经同步成功，
            不因为重新保存而改回 false。
        */

        if (
            activeBeadsCheckpoint
                .draws[index]
                .synced === true
        ) {

            savedDraw.synced =
                true;

        }


        activeBeadsCheckpoint
            .draws[index] =
            savedDraw;

    }
    else {

        activeBeadsCheckpoint
            .draws
            .push(
                savedDraw
            );

    }


    activeBeadsCheckpoint
        .trial_elapsed_ms[
            String(trial)
        ] =
        Math.round(
            elapsedMs || 0
        );


    saveBeadsCheckpoint();

}


/* =========================================================
   标记珠子已同步
========================================================= */

function markBeadsDrawSynced(
    trial,
    beadIndex
) {

    if (
        !activeBeadsCheckpoint
    ) {

        return;

    }


    const row =
        activeBeadsCheckpoint
            .draws
            .find(
                function(d) {

                    return (
                        Number(d.trial) ===
                            Number(trial)
                        &&
                        Number(d.bead_index) ===
                            Number(beadIndex)
                    );

                }
            );


    if (
        row
    ) {

        row.synced =
            true;


        saveBeadsCheckpoint();

    }

}


/* =========================================================
   保存 Final Decision
========================================================= */

function saveBeadsFinalCheckpoint(
    finalData
) {

    if (
        !activeBeadsCheckpoint
    ) {

        return;

    }


    const trial =
        Number(
            finalData.trial
        );


    const index =
        activeBeadsCheckpoint
            .finals
            .findIndex(
                function(f) {

                    return (
                        Number(f.trial) ===
                        trial
                    );

                }
            );


    const savedFinal =
        Object.assign(
            {},
            finalData,
            {
                synced:
                    false
            }
        );


    if (
        index >= 0
    ) {

        if (
            activeBeadsCheckpoint
                .finals[index]
                .synced === true
        ) {

            savedFinal.synced =
                true;

        }


        activeBeadsCheckpoint
            .finals[index] =
            savedFinal;

    }
    else {

        activeBeadsCheckpoint
            .finals
            .push(
                savedFinal
            );

    }


    saveBeadsCheckpoint();

}


/* =========================================================
   标记 Final 已同步
========================================================= */

function markBeadsFinalSynced(
    trial
) {

    if (
        !activeBeadsCheckpoint
    ) {

        return;

    }


    const row =
        activeBeadsCheckpoint
            .finals
            .find(
                function(f) {

                    return (
                        Number(f.trial) ===
                        Number(trial)
                    );

                }
            );


    if (
        row
    ) {

        row.synced =
            true;


        saveBeadsCheckpoint();

    }

}


/* =========================================================
   Trial 恢复状态
========================================================= */

function getBeadsTrialBackup(
    trialNum
) {

    if (
        !activeBeadsCheckpoint
    ) {

        return null;

    }


    const draws =
        activeBeadsCheckpoint
            .draws
            .filter(
                function(d) {

                    return (
                        Number(d.trial) ===
                        Number(trialNum)
                    );

                }
            )
            .sort(
                function(a, b) {

                    return (
                        Number(a.bead_index) -
                        Number(b.bead_index)
                    );

                }
            );


    const finalRow =
        activeBeadsCheckpoint
            .finals
            .find(
                function(f) {

                    return (
                        Number(f.trial) ===
                        Number(trialNum)
                    );

                }
            );


    const lastDraw =
        draws.length > 0
            ?
            draws[
                draws.length - 1
            ]
            :
            null;


    return {

        draws:
            draws,

        completed:
            !!finalRow,

        final:
            finalRow || null,

        nextBeadIndex:
            draws.length,

        drawnSeq:
            draws.map(
                function(d) {

                    return d.bead_color;

                }
            ),

        lastProbability:
            lastDraw
                ?
                lastDraw.q2_probability
                :
                null,

        elapsedMs:
            Number(
                activeBeadsCheckpoint
                    .trial_elapsed_ms[
                        String(trialNum)
                    ] || 0
            )

    };

}


/* =========================================================
   Trial 是否已经完成
========================================================= */

function isBeadsTrialCompleted(
    trialNum
) {

    const state =
        getBeadsTrialBackup(
            trialNum
        );


    return (
        state &&
        state.completed
    );

}


/* =========================================================
   恢复旧数据到 jsPsych
========================================================= */

function restoreBeadsDataToJsPsych(
    jsPsychInstance
) {

    if (
        !activeBeadsCheckpoint
    ) {

        return;

    }


    activeBeadsCheckpoint
        .draws
        .forEach(
            function(d) {

                jsPsychInstance
                    .data
                    .write({

                        trial:
                            d.trial,

                        ratio:
                            d.ratio,

                        bead_index:
                            d.bead_index,

                        bead_color:
                            d.bead_color,

                        question:
                            "Q1_jar",

                        q1_response:
                            d.q1_response,

                        q1_rt:
                            d.q1_rt,

                        trialTimestamp:
                            d.trialTimestamp,

                        restored:
                            true

                    });


                jsPsychInstance
                    .data
                    .write({

                        trial:
                            d.trial,

                        ratio:
                            d.ratio,

                        bead_index:
                            d.bead_index,

                        bead_color:
                            d.bead_color,

                        question:
                            "Q2_probability",

                        q2_probability:
                            d.q2_probability,

                        q2_rt:
                            d.q2_rt,

                        restored:
                            true

                    });


                jsPsychInstance
                    .data
                    .write({

                        trial:
                            d.trial,

                        ratio:
                            d.ratio,

                        bead_index:
                            d.bead_index,

                        bead_color:
                            d.bead_color,

                        question:
                            "Q3_sufficient",

                        q3_sufficient:
                            d.q3_sufficient,

                        q3_rt:
                            d.q3_rt,

                        restored:
                            true

                    });

            }
        );


    activeBeadsCheckpoint
        .finals
        .forEach(
            function(f) {

                jsPsychInstance
                    .data
                    .write({

                        trial:
                            f.trial,

                        ratio:
                            f.ratio,

                        question:
                            "Final_decision",

                        final_jar:
                            f.final_jar,

                        correct_jar:
                            f.correct_jar,

                        is_correct:
                            f.is_correct,

                        dtd:
                            f.dtd,

                        is_JTC_bias:
                            f.is_JTC_bias,

                        dt:
                            f.dt,

                        frt_ms:
                            f.frt_ms,

                        restored:
                            true

                    });

            }
        );

}


/* =========================================================
   标记实验本地完成
========================================================= */

function markBeadsExperimentCompletedLocal() {

    if (
        !activeBeadsCheckpoint
    ) {

        return;

    }


    activeBeadsCheckpoint
        .experiment_completed =
        true;


    saveBeadsCheckpoint();

}


/* =========================================================
   是否全部已经同步
========================================================= */

function allBeadsCheckpointSynced() {

    if (
        !activeBeadsCheckpoint
    ) {

        return true;

    }


    const drawsOK =
        activeBeadsCheckpoint
            .draws
            .every(
                function(d) {

                    return (
                        d.synced === true
                    );

                }
            );


    const finalsOK =
        activeBeadsCheckpoint
            .finals
            .every(
                function(f) {

                    return (
                        f.synced === true
                    );

                }
            );


    return (
        drawsOK &&
        finalsOK
    );

}