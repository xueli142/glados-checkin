

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
    for(const cookie  of String(process.env.GLADOS).split('\n')){
        if(!cookie)continue

try{
    const common = {
  'cookie': cookie,
  'referer': 'https://glados.cloud/console/checkin',
  'user-agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
}

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
//末尾加这个是解析json的操作
    }).then((r)=>r.json())
    if(status?.code)throw new Error(status?.message)
            notice.push('glados签到成功',
                `${action?.message}`,
                `还剩下${Number(status?.data?.leftDays)}天`
)

}catch(error){
    notice.push('出错了',
        `${error}`
    )
    
}
}
    return notice
}

const main = async ()=>{
const result = await glados()
//打印签到结果
console.log('=========签到结果==========')
for( const line of result){
    console.log(line)
}
console.log('=======================')

//推送结果到机器人
if(result.length){
    await notify(`glados 签到结果\n${result.join('\n')}`)
}
}

main()
