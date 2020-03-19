const Discord=require('discord.js')
const client=new Discord.Client();
const fs=require('fs')
const ytdl=require('ytdl-core')

const prefix="."
const dispatcherOpts={
  vol:.5
}
let dispatcher=null
let connection=null

client.once('ready',_=>{
  console.log('yasz')
})

const commands={
  'play':(args,msg)=>play(args,msg),
  'vol':(args,msg)=>setVolume(args,msg),
  'leave':(args,msg)=>leave(args,msg),
  'pause':(args,msg)=>pause(args,msg),
  'resume':(args,msg)=>resume(args,msg)
}

client.on('message',async msg=>{
  const args=msg.content.slice(prefix.length).split(' ')
  const command=args.shift().toLowerCase()
  if(command in commands){
    commands[command](args,msg)
  }
})

const play=async (args,msg)=>{
  if(msg.member.voice.channel){
    if(!ytdl.validateURL(args[0])) return await msg.channel.send('Can\'t parse URL')
    const stream=ytdl(args[0],{filter:'audioonly'})
    stream.pause()
    stream.on('info',async info => {
      await msg.channel.send(`Playing \`${info.title}\`!`)
      connection=await msg.member.voice.channel.join()
      dispatcher=connection.play(stream,dispatcherOpts)
      .on('end',()=>{
        connection.channel.leave()
        dispatcher=null
        connection=null
      })
    })
  }
}

const setVolume=async (args,msg)=>{
  if(!args.length) return await msg.channel.send(`\`${dispatcherOpts.vol}\``)
  if(isNaN(args[0])) return await msg.channel.send('Volume goes from `0` to `1` e.g. `0.25`.')
  dispatcherOpts.vol=args[0]
  dispatcher && dispatcher.setVolume(args[0])
  return await msg.channel.send('Volume set to '+dispatcherOpts.vol)
}

const leave=async(args,msg)=>{
  if(!connection) return await msg.channel.send('Not currently in voice.') 
  connection.channel.leave()
  msg.channel.send('Left channel.')
}

const pause=async(args,msg)=>{
  dispatcher.pause()
  msg.channel.send('Paused song.')
}
const resume=async(args,msg)=>{
  dispatcher.resume()
  msg.channel.send('Rezoooom eh')
}
client.login(require('./config.json').token)
