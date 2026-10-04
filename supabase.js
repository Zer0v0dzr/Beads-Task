/* =========================================================
   Beads Task
   Supabase Database Module
========================================================= */


/* =========================================================
   数据库状态显示
========================================================= */

function setDBStatus(
    text,
    status
) {

    var el =
        document.getElementById(
            "db-status"
        );


    if (!el) {
        return;
    }


    el.textContent =
        "数据库：" + text;


    if (status === "ok") {

        el.style.background =
            "#d9f5d9";

        el.style.color =
            "#176b17";

    }

    else if (status === "error") {

        el.style.background =
            "#ffd6d6";

        el.style.color =
            "#8b0000";

    }

    else {

        el.style.background =
            "#eeeeee";

        el.style.color =
            "#333333";

    }

}


/* =========================================================
   初始化 Supabase
========================================================= */

var supabaseClient =
    null;


if (
    typeof window.supabase ===
    "undefined"
) {

    console.warn(
        "Supabase SDK unavailable. " +
        "Experiment will continue locally."
    );


    setDBStatus(
        "连接不可用，仅本地保存",
        "error"
    );

}
else {

    try {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );


        console.log(
            "Supabase SDK initialized."
        );


        setDBStatus(
            "SDK已加载",
            "waiting"
        );

    }
    catch (error) {

        console.error(
            "Supabase initialization failed:",
            error
        );


        supabaseClient =
            null;


        setDBStatus(
            "初始化失败，仅本地保存",
            "error"
        );

    }

}


/* =========================================================
   Session state
========================================================= */

var currentBeadsSessionID =
    null;


var beadsSessionReadyPromise =
    null;


/* =========================================================
   工具
========================================================= */

function wait(ms) {

    return new Promise(
        function(resolve) {

            setTimeout(
                resolve,
                ms
            );

        }
    );

}


/* =========================================================
   生成标准 UUID
========================================================= */

function generateSessionID() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto
            .randomUUID();

    }


    /*
        老浏览器 / 微信 WebView fallback
        仍生成标准 UUID v4 格式
    */

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
        .replace(
            /[xy]/g,
            function(c) {

                var r =
                    Math.random() *
                    16 |
                    0;


                var v =
                    c === "x"
                        ?
                        r
                        :
                        (
                            r &
                            0x3 |
                            0x8
                        );


                return v.toString(16);

            }
        );

}


/* =========================================================
   创建 / 恢复 Session

   preferredSessionID:
   - 新实验：不传
   - 恢复实验：传旧 session_id
========================================================= */

async function createBeadsSession(
    subjectID,
    preferredSessionID
) {

    /*
        数据库不可用：
        实验继续、本地保存。
    */

    if (
        !supabaseClient
    ) {

        setDBStatus(
            "连接不可用，仅本地保存",
            "error"
        );


        return false;

    }


    if (
        currentBeadsSessionID
    ) {

        return true;

    }


    currentBeadsSessionID =
        preferredSessionID ||
        generateSessionID();


    setDBStatus(
        "正在连接...",
        "waiting"
    );


    for (
        var attempt = 1;
        attempt <= 3;
        attempt++
    ) {

        try {

            var response =
                await supabaseClient
                    .from(
                        "beads_sessions"
                    )
                    .insert({

                        session_id:
                            currentBeadsSessionID,

                        subject:
                            subjectID

                    });


            /* ==============================
               新 Session 创建成功
            ============================== */

            if (
                !response.error
            ) {

                console.log(
                    "Supabase: Beads session created:",
                    currentBeadsSessionID
                );


                setDBStatus(
                    "连接正常",
                    "ok"
                );


                return true;

            }


            /* ==============================
               23505 = Session 已存在

               恢复旧实验时这是正常情况
            ============================== */

            if (
                response.error.code ===
                "23505"
            ) {

                console.log(
                    "Supabase: existing Beads session reused:",
                    currentBeadsSessionID
                );


                setDBStatus(
                    "连接正常",
                    "ok"
                );


                return true;

            }


            console.error(
                "Supabase: session creation attempt " +
                attempt +
                " failed:",
                response.error
            );


            setDBStatus(
                "连接失败 " +
                attempt +
                "/3",
                "error"
            );

        }
        catch (error) {

            console.error(
                "Supabase: session creation attempt " +
                attempt +
                " failed:",
                error
            );


            setDBStatus(
                "连接异常 " +
                attempt +
                "/3",
                "error"
            );

        }


        if (
            attempt < 3
        ) {

            await wait(
                1000 *
                attempt
            );

        }

    }


    console.warn(
        "Supabase unavailable. " +
        "Experiment will continue locally."
    );


    setDBStatus(
        "连接失败，仅本地保存",
        "error"
    );


    return false;

}


/* =========================================================
   上传一颗珠子
========================================================= */

async function uploadBeadsDraw(
    drawData
) {

    if (
        !supabaseClient
    ) {

        setDBStatus(
            "未连接，仅本地保存",
            "error"
        );


        return false;

    }


    /*
        等待 Session 创建
    */

    if (
        beadsSessionReadyPromise
    ) {

        var sessionOK =
            await beadsSessionReadyPromise;


        if (
            !sessionOK
        ) {

            setDBStatus(
                "未连接，仅本地保存",
                "error"
            );


            return false;

        }

    }


    if (
        !currentBeadsSessionID
    ) {

        setDBStatus(
            "无有效Session，仅本地保存",
            "error"
        );


        return false;

    }


    var dbRow = {

        session_id:
            currentBeadsSessionID,

        subject:
            drawData.subject,

        trial:
            drawData.trial,

        ratio:
            drawData.ratio,

        bead_index:
            drawData.bead_index,

        bead_color:
            drawData.bead_color,

        q1_response:
            drawData.q1_response,

        q1_rt:
            drawData.q1_rt,

        q2_probability:
            drawData.q2_probability,

        q2_rt:
            drawData.q2_rt,

        q3_sufficient:
            drawData.q3_sufficient,

        q3_rt:
            drawData.q3_rt,

        trial_timestamp:
            drawData.trialTimestamp

    };


    for (
        var attempt = 1;
        attempt <= 3;
        attempt++
    ) {

        try {

            var response =
                await supabaseClient
                    .from(
                        "beads_draws"
                    )
                    .insert(
                        dbRow
                    );


            /* ==============================
               正常上传成功
            ============================== */

            if (
                !response.error
            ) {

                console.log(
                    "Supabase: draw uploaded:",
                    drawData.trial,
                    drawData.bead_index
                );


                /*
                    告诉 backup.js：
                    这颗已经安全同步。
                */

                if (
                    typeof markBeadsDrawSynced ===
                    "function"
                ) {

                    markBeadsDrawSynced(
                        drawData.trial,
                        drawData.bead_index
                    );

                }


                setDBStatus(
                    "实时同步正常",
                    "ok"
                );


                return true;

            }


            /* ==============================
               23505 = 已经存在

               例如：
               恢复实验后重新上传旧珠子。

               视为已经安全保存。
            ============================== */

            if (
                response.error.code ===
                "23505"
            ) {

                console.log(
                    "Supabase: draw already exists:",
                    drawData.trial,
                    drawData.bead_index
                );


                if (
                    typeof markBeadsDrawSynced ===
                    "function"
                ) {

                    markBeadsDrawSynced(
                        drawData.trial,
                        drawData.bead_index
                    );

                }


                setDBStatus(
                    "实时同步正常",
                    "ok"
                );


                return true;

            }


            console.error(
                "Supabase: draw upload attempt " +
                attempt +
                " failed:",
                response.error
            );

        }
        catch (error) {

            console.error(
                "Supabase: draw upload attempt " +
                attempt +
                " failed:",
                error
            );

        }


        if (
            attempt < 3
        ) {

            await wait(
                1000 *
                attempt
            );

        }

    }


    console.warn(
        "Supabase: draw upload failed. " +
        "Local backup retained:",
        drawData
    );


    setDBStatus(
        "部分上传失败，本地数据已保留",
        "error"
    );


    return false;

}


/* =========================================================
   完成一个 Trial
========================================================= */

async function completeBeadsTrial(
    resultData
) {

    if (
        !supabaseClient
    ) {

        return false;

    }


    if (
        beadsSessionReadyPromise
    ) {

        var sessionOK =
            await beadsSessionReadyPromise;


        if (
            !sessionOK
        ) {

            return false;

        }

    }


    if (
        !currentBeadsSessionID
    ) {

        return false;

    }


    for (
        var attempt = 1;
        attempt <= 3;
        attempt++
    ) {

        try {

            var response =
                await supabaseClient
                    .rpc(
                        "complete_beads_trial",
                        {

                            p_session_id:
                                currentBeadsSessionID,

                            p_trial:
                                resultData.trial,

                            p_bead_index:
                                resultData.bead_index,

                            p_dtd:
                                resultData.dtd,

                            p_final_jar:
                                resultData.final_jar,

                            p_correct_jar:
                                resultData.correct_jar,

                            p_is_correct:
                                resultData.is_correct,

                            p_is_jtc_bias:
                                resultData.is_JTC_bias,

                            p_dt:
                                resultData.dt,

                            p_frt_ms:
                                resultData.frt_ms

                        }
                    );


            if (
                !response.error
            ) {

                console.log(
                    "Supabase: trial completed:",
                    resultData.trial
                );


                /*
                    Final 数据已经同步
                */

                if (
                    typeof markBeadsFinalSynced ===
                    "function"
                ) {

                    markBeadsFinalSynced(
                        resultData.trial
                    );

                }


                setDBStatus(
                    "实时同步正常",
                    "ok"
                );


                return true;

            }


            console.error(
                "Supabase: trial completion attempt " +
                attempt +
                " failed:",
                response.error
            );

        }
        catch (error) {

            console.error(
                "Supabase: trial completion attempt " +
                attempt +
                " failed:",
                error
            );

        }


        if (
            attempt < 3
        ) {

            await wait(
                1000 *
                attempt
            );

        }

    }


    setDBStatus(
        "部分上传失败，本地数据已保留",
        "error"
    );


    return false;

}


/* =========================================================
   完成整个实验
========================================================= */

async function completeBeadsSession() {

    if (
        !supabaseClient
    ) {

        setDBStatus(
            "未连接，本地数据已保留",
            "error"
        );


        return false;

    }


    if (
        beadsSessionReadyPromise
    ) {

        var sessionOK =
            await beadsSessionReadyPromise;


        if (
            !sessionOK
        ) {

            setDBStatus(
                "未同步，本地数据已保留",
                "error"
            );


            return false;

        }

    }


    if (
        !currentBeadsSessionID
    ) {

        return false;

    }


    for (
        var attempt = 1;
        attempt <= 3;
        attempt++
    ) {

        try {

            var response =
                await supabaseClient
                    .rpc(
                        "complete_beads_session",
                        {

                            p_session_id:
                                currentBeadsSessionID

                        }
                    );


            if (
                !response.error
            ) {

                console.log(
                    "Supabase: Beads session completed:",
                    currentBeadsSessionID
                );


                setDBStatus(
                    "实验数据已同步",
                    "ok"
                );


                return true;

            }


            console.error(
                "Supabase: session completion attempt " +
                attempt +
                " failed:",
                response.error
            );

        }
        catch (error) {

            console.error(
                "Supabase: session completion attempt " +
                attempt +
                " failed:",
                error
            );

        }


        if (
            attempt < 3
        ) {

            await wait(
                1000 *
                attempt
            );

        }

    }


    console.warn(
        "Supabase: failed to complete Beads session."
    );


    setDBStatus(
        "同步未完成，本地数据已保留",
        "error"
    );


    return false;

}