import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { BiMenuAltRight } from "react-icons/bi";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif.gif"
// import { console } from 'inspector'

function Home() {
  const { userData , serverUrl,setUserData, getGeminiResponse} = useContext(userDataContext)
  const navigate =useNavigate()
  const[listening,setListening]=useState(false)
  const[userText,setUserText]=useState("")
  const[aiText,setAiText]=useState("")
  const isSpeakingRef=useRef(false)
  const recognitionRef=useRef(null)
  const[ham,setHam]=useState(false)
  const isRecognizingRef = useRef(false)
  const synth=window.speechSynthesis

  const handleLogout =async () => {
    try {
      const result =await axios.get(`${serverUrl}/api/auth/logout`,
        {withCredentials:true})
        setUserData(null)
        navigate("/signin")
    } catch (error) {
      setUserData(null)
      console.log(error); 
    }
  }
   const StartRecognition =()=>{
    if(!isSpeakingRef.current && !isRecognizingRef.current){
          try {
      recognitionRef.current?.start();
      console.log("Recognition Requested to start");
    } catch (error) {
      if(error.name !=="InvalidStateError"){
        console.error("Start error:",error);
      }
    }
    
      
    }
   };

const speak = (text) => {
  const utterence = new SpeechSynthesisUtterance(text)
  utterence.lang = 'en-US'
    const voices = window.speechSynthesis.getVoices()
    const hindiVoice = voices.find(v => v.lang === 'hi-IN')
    if (hindiVoice) {
      utterence.voice = hindiVoice;
      utterence.lang= 'hi-IN';
    }else{
     utterence.voice=voices[0];
     utterence.lang=voices[0]?.lang || 'en-US';
    }

    isSpeakingRef.current = true
    utterence.onend = () => {
      setAiText("")
      isSpeakingRef.current = false
      setTimeout(() => {
        StartRecognition()
      }, 800)
    }
    synth.cancel();
    synth.speak(utterence);
  }

  
const handleCommand=(data)=>{
  const{type,userInput,response}=data
  speak(response);

  if(type ==='google-search'){
    const query=encodeURIComponent(userInput);
    window.open(`https://www.google.com/webhp?q=${query}`,'_blank');
  }

  if(type ==='calculator-open'){
    window.open('https://www.google.com/search?q=calculator','_blank');
  }
  if(type ==='instagram-open'){
    window.open('https://www.instagram.com/','_blank');
  }
  if(type ==='facebook-open'){
    window.open('https://www.facebook.com/','_blank');
  }
   if(type ==='weather-show'){
    const city=encodeURIComponent(userInput);
    window.open('https://www.google.com/search?q=weather', '_blank');
  }
  if(type ==='youtube-search'|| type ==='youtube-play'){
    const query=encodeURIComponent(userInput);
    window.open(`https://www.youtube.com/results?search_query=${query}`,'_blank');
  }
}



  useEffect(()=>{
  
    const SpeechRecognition=window.SpeechRecognition || window.webkitSpeechRecognition; 
    const recognition=new SpeechRecognition();


    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults=false;


  recognitionRef.current=recognition;

  let isMounted=true;

  const startTimeout=setTimeout(()=>{
    if(isMounted && !isSpeakingRef.current && !isRecognizingRef.current){
      try {
        recognition.start();
      console.log("Recognition requested to  started")
        
      } catch (e) {
        if(e.name !=="InvalidStateError"){
          console.error(e);
        }
        
      }
      
      
    }
  },1000);


//   const safeRecognition=()=>{
//     if(!isSpeakingRef.current && ! isRecognizingRef.current){
//     try {
//       recognition.start();
      
//     } catch (err) {
//       if(err.name !=="InvalidStateError"){
//         console.error(" Start error: ", err);

//       }
      
//     }
//   }
// }

   recognition.onstart=()=>{
    isRecognizingRef.current=true;
    setListening(true);
    
   };
   recognition.onend=()=>{  
    isRecognizingRef.current=false;
    setListening(false);
    if(isMounted && !isSpeakingRef.current){
      setTimeout(()=>{
        if(isMounted){
          try {
            recognition.start();
            console.log("Recognition restarted");
            
          } catch (e) {
            if(e.name !=="InvalidStateError"){
              console.error(e);
            }
          }
        }
      },1000);
    }
   
   };
   recognition.onerror=(event)=>{
    console.warn("Recognition error:",event.error);
    isRecognizingRef.current=false;
    setListening(false);
    if(event.error !=="aborted" && isMounted && !isSpeakingRef.current){
      setTimeout(()=>{
        if(isMounted){
          try {
            recognition.start();
            console.log("Recognition restarted after error");
            
          } catch (e) {
            if(e.name!=="InvalidStateError"){
              console.error(e);
            }
          }
        }
      },1000);
    }
   };
   

 
    recognition.onresult= async(e)=>{
      const transcript=e.results[e.results.length-1][0].transcript.trim()
       if(transcript.toLowerCase().includes(userData.assistantName.toLowerCase())){
        setAiText("")
        setUserText(transcript)
        recognition.stop()
        isRecognizingRef.current=false
        setListening(false)
       const data=await getGeminiResponse(transcript)
       handleCommand(data)
       setAiText(data.response)
       setUserText("")
       }
      
    };
  
   
      const greeting =new SpeechSynthesisUtterance(`Hello ${userData.name},what can I help you with?`);
      greeting.lang='en-US';
      window.speechSynthesis.speak(greeting);
    


    return()=>{
      isMounted=false;
      clearTimeout(startTimeout);
      recognition.stop();
      setListening(false);
      isRecognizingRef.current=false;
    };
  },[]);
    
  console.log('userData in Home:', userData)
  console.log('assistantImage:', userData?.assistantImage)
  
  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#030353] flex justify-center items-center flex-col gap-[15px] overflow-hidden '>
      <BiMenuAltRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]'onClick={()=>setHam(true)} />
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham?"translate-x-0":"translate-x-full"} transition-transform`}>
        <RxCross1  className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(false)} />
         <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white rounded-full text-[19px] cursor-pointer'onClick={handleLogout}>Log Out</button>
        <button className='min-w-[150px] h-[60px]  text-black font-semibold bg-white  rounded-full text-[19px] px-[20px] py-[10px] cursor-pointer 'onClick={()=>navigate("/customize")}>Customize your Assistant</button>
          
      <div className='w-full h-[2px] bg-gray-400'></div>
      <h1 className='text-white  font-semibold text-[19px]'>History</h1>
      <div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col '>      
      {userData.history?.map((his,idx)=>{
          <span key={idx} className='text-gray-200 text-[18px] truncate mt-[20px] '>{his}</span>
        })}
      </div>

      </div>
       <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px] bg-white rounded-full text-[19px] cursor-pointer'onClick={handleLogout}>Log Out</button>
        <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white absolute top-[100px] right-[20px] rounded-full text-[19px] px-[20px] py-[10px] cursor-pointer hidden lg:block'onClick={()=>navigate("/customize")}>Customize your Assistant</button>
      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg '>
        <img src={userData?.assistantImage} alt="Assistant" className='h-full object-cover ' />
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="" className='w-[200px]'/>}
      {aiText && <img src={aiImg} alt="" className='w-[200px]'/>}
      <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText?userText:aiText?aiText:null}</h1>
      
    </div>
  )
    
 
}
export default Home
