const Discord=require('discord.js')
const client=new Discord.Client();
const ytdl=require('ytdl-core')

const prefix="."
const dispatcherOpts={
  vol:.2
}
const queue={}

client.once('ready',_=>{
  console.log('yasz')
})

const commands={
  'play':(args,msg)=>play(args,msg),
  'vol':(args,msg)=>setVolume(args,msg),
  'leave':(args,msg)=>leave(args,msg),
  'pause':(args,msg)=>pause(args,msg),
  'resume':(args,msg)=>resume(args,msg),
  'seek':(args,msg)=>seek(args,msg),
  'queue':(args,msg)=>getQueue(args,msg),
  'skip':(args,msg)=>skip(args,msg),
  'end':(args,msg)=>end(args,msg)
}

client.on('message',async msg=>{
  const args=msg.content.slice(prefix.length).split(' ')
  const command=args.shift().toLowerCase()
  if(command in commands){
    commands[command](args,msg)
  }
})
process.on('SIGINT',async()=>{
  Object.values(queue).forEach(async v=>v.connection&&await connection.channel.leave())
  process.exit()
})

const play=async ([url],msg)=>{
  if(msg.member.voice.channel){
    if(!ytdl.validateURL(url)) return await msg.channel.send('Can\'t parse URL')
    ytdl.getBasicInfo(url).then(info=>{
      addToQueue({title:info.title,length:info.length_seconds,url,voiceChannel:msg.member.voice.channel,channel:msg.channel})
    })
  }
}

const playNext=async(VID,time=0)=>{
  if(!!queue[VID].songs.length){
    console.log(time)
    const {url,title,length} = queue[VID].playing=queue[VID].songs.shift()
    const {channel,voiceChannel}=queue[VID]
    const stream=ytdl(url,{filter:'audioonly',type:'opus',begin:time})
    .pause(true)
    .on('info',async info=>{
        channel.send(`Playing \`${title}\`!\nLength: \`${length}s\``)
        let connection=queue[VID].connection
        if(!connection){
          connection=queue[VID].connection=await voiceChannel.join()
        }
        stream.resume()
        connection.play(stream,dispatcherOpts)
        .on('finish',()=>playNext(VID))
    })
  }else{
    queue[VID].voiceChannel.leave()
    queue[VID].connection=null
    queue[VID].playing=null
  }
}
const addToQueue=({title,url,voiceChannel,length,channel})=>{
  const VID=voiceChannel.id
  if(!(VID in queue)) queue[VID]={songs:[],connection:null,playing:null,channel,voiceChannel}
  queue[VID].songs.push({title,url,length})
  if(!(queue[VID].playing)){
    playNext(VID)
  }
}

const setVolume=async ([vol],msg)=>{
  if(!msg.member.voice.channel)return await msg.channel.send('You are no in a voice channeru')
  if(!vol) return await msg.channel.send(`\`${dispatcherOpts.vol}\``)
  if(isNaN(vol)) return await msg.channel.send('Volume goes from `0` to `1` e.g. `0.25`.')
  let k=queue[msg.member.voice.channel.id]
  dispatcherOpts.vol=vol
  k.playing && k.connection.dispatcher.setVolume(vol)
  return await msg.channel.send('Volume set to '+dispatcherOpts.vol)
}

const leave=async(args,msg)=>{
  if(!msg.member.voice.channel)return await msg.channel.send('You are no in a voice channeru')
  let k=queue[msg.member.voice.channel.id]
  if(!k.connection) return await msg.channel.send('Not currently in voice.') 
  k.connection.channel.leave()
  queue[msg.member.voice.channel.id]=null
  msg.channel.send('Left channel.')
}

const pause=async(args,msg)=>{
  if(!msg.member.voice.channel)return await msg.channel.send('You are no in a voice channeru')
  let k=queue[msg.member.voice.channel.id]
  if(!k.connection) return await msg.channel.send('Not currently in voice.') 
  k.connection.dispatcher.pause()
  msg.channel.send('Paused song.')
}
const resume=async(args,msg)=>{
  if(!msg.member.voice.channel)return await msg.channel.send('You are no in a voice channeru')
  let k=queue[msg.member.voice.channel.id]
  if(!k.connection) return await msg.channel.send('Not currently in voice.') 
  k.connection.dispatcher.resume()
  msg.channel.send('Rezoooom eh')
}
const getQueue=async(args,msg)=>{
  if(!msg.member.voice.channel)return await msg.channel.send('You are no in a voice channeru')
  let k=queue[msg.member.voice.channel.id]
  if(!k.connection) return await msg.channel.send('Not currently in voice.') 
  if(!k.songs.length) return await msg.channel.send('Queue is empty')
  msg.channel.send('```ini\nQueue:\n-'+k.songs.map(x=>x.title).join('\n-')+'```')
}
const skip=async(args,msg)=>{
  if(!msg.member.voice.channel)return await msg.channel.send('You are no in a voice channeru')
  let k=queue[msg.member.voice.channel.id]
  if(!k.connection) return await msg.channel.send('Not currently in voice.') 
  // k.connection.dispatcher.end()
  playNext(msg.member.voice.channel.id)
  msg.channel.send('Skipped song.')
}
const seek=async([time],msg)=>{
  console.log(time)
  if(!time) return await msg.channel.send('Time with format `[[hh:]mm:]ss[.xxx]]]]`')
  if(!msg.member.voice.channel) return await msg.channel.send('You are no in a voice channeru')
  let k=queue[msg.member.voice.channel.id]
  if(!k.connection) return await msg.channel.send('Not currently in voice.') 
  k.songs.unshift(k.playing)
  playNext(msg.member.voice.channel.id,time)
}
const end=async(args,msg)=>{
  let k=queue[msg.member.voice.channel.id]
  k.connection.dispatcher.end()
}

client.login(require('./config.json').token)
