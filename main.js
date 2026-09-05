
const notify = async (text)=>{
    const base = process.env.NOTIFY
    if(!base)return console.log('[notify] 未配置 NOTIFY，跳过推送')
    try{
        const url = new URL(base)
        const body = { text }
        if(!url.searchParams.has('chat_id')){
            const chatId = process.env.TG_CHAT_ID || process.env.CHAT_ID
            if(!chatId)return console.log('[notify] NOTIFY 未带 chat_id 且未配置 TG_CHAT_ID，跳过推送')
            body.chat_id = chatId
        }
        const res = await fetch(url.href,{
            method:'POST',
            headers:{'content-type':'application/json'},
            body: JSON.stringify(body)
        }).then(r=>r.json())
        if(res?.ok)console.log('[notify] 推送成功')
        else console.log('[notify] 推送失败:', res?.description || JSON.stringify(res))
    }catch(e){
        console.log('[notify] 推送异常:', String(e))
    }
}

const glados = async ()=>{
    //用于存储签到结果
    const notice = []
    //硬编码环境变量cookie
    if(!process.env.GLADOS){
        notice.push("缺少cookie")
        return notice
    }
    for(const cookie of String(process.env.GLADOS).split('\n')){
        if(!cookie)continue

        const common = {
            'cookie': cookie,
            'referer': 'https://glados.cloud/console/checkin',
            'user-agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
        }

        try{
            const action = await fetch ('https://glados.cloud/api/user/checkin',{
                method:'POST',
                headers:{...common,'content-type':'application/json'},
                body:'{"token":"glados.cloud"}'
            }).then((r)=>r.json())
            //如果action.code存在为真，视为签到失败
            if(action?.code)throw new Error(action?.message)

            const status = await fetch ('https://glados.cloud/api/user/status',{
                method:'GET',
                headers:{...common}
            }).then((r)=>r.json())
            if(status?.code)throw new Error(status?.message)

            notice.push('glados签到成功',
                `${action?.message}`,
                `还剩下${Number(status?.data?.leftDays)}天`
            )
        }catch(error){
            const ALREADY = 
                "Today's observation logged. Return tomorrow for more points."
            
            if(error?.message==ALREADY){
            notice.push('今天已经签到了，明天再来')
            }else{
                notice.push('出错了',
                `${error}`)
            }
        }

        //无论签到是否成功，都查询积分情况一并展示
        try{
            const points = await fetch ('https://glados.one/api/user/points',{
                method:'GET',
                headers:{...common,'referer':'https://glados.one/console'}
            }).then((r)=>r.json())
            if(points?.code)throw new Error(points?.message)

            notice.push(`累计积分${Number(points?.points)}点，连续签到${points?.streak}天`)
            const today = points?.history?.[0]
            if(today){
                const change = Number(today?.change)
                notice.push(`最近记录${today?.detail}：${change > 0 ? '+' : ''}${change}点`)
            }
        }catch(e){
            notice.push(`积分查询失败: ${e.message}`)
        }
    }
    return notice
}

const main = async ()=>{
    const result = await glados()
    //打印签到结果
    console.log('=========签到结果==========')
    for(const line of result){
        console.log(line)
    }
    console.log('=======================')

    //推送结果到机器人
    if(result.length){
        await notify(`glados 签到结果\n${result.join('\n')}`)
    }
}

main()
