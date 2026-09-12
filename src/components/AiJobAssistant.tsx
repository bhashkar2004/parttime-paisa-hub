import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Trash2,
  Loader2,
  MessageCircle,
  MapPin,
} from "lucide-react";
import assistantLogo from "@/assets/ai-assistant.png";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Find evening part-time jobs",
  "Jobs near me",
  "Mujhe shop mein kaam chahiye",
  "Which job is best for me?",
];

const getSpeechRecognition = () =>
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const VOICE_LANGS = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिंदी" },
  { code: "te-IN", label: "తెలుగు" },
] as const;

const NEAR_ME = /near me|nearby|near by|around me|mere paas|mere pass|paas m|aas paas|aaspaas|naa daggara|na daggara|daggarlo|chuttupakkala/i;

const getCurrentPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000,
    });
  });

const reverseGeocode = async (lat: number, lon: number) => {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
  );
  if (!res.ok) throw new Error("Could not read your area name.");
  const data = await res.json();
  const place =
    data.locality || data.city || data.principalSubdivision || data.countryName || "";
  if (!place) throw new Error("Could not read your area name.");
  return String(place);
};


const AiJobAssistant = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [myLocation, setMyLocation] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [voiceLang, setVoiceLang] = useState<string>("en-IN");


  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // Load the saved conversation for this account.
  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("ai_chat_messages")
      .select("id, role, content")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load chat history", error);
          return;
        }
        setMessages((data ?? []) as ChatMessage[]);
      });
  }, [open, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (open && !sending) textareaRef.current?.focus();
  }, [open, sending]);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    try {
      setSpeaking(true);
      const { data, error } = await supabase.functions.invoke("ai-voice-speak", {
        body: { text },
      });
      if (error || !data?.audio) throw error ?? new Error("No audio");
      const audio = new Audio(`data:${data.mimeType};base64,${data.audio}`);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      await audio.play();
    } catch (err) {
      console.error("Speech failed", err);
      setSpeaking(false);
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || sending) return;
      if (!user) {
        toast.error("Please login first", { description: "Login to chat with the assistant." });
        return;
      }

      let outgoing = message;
      if (NEAR_ME.test(message)) {
        if (!myLocation) {
          setInput("");
          setNeedsLocation(true);
          return;
        }
        outgoing = `${message} (my current location is ${myLocation})`;
      }


      stopAudio();
      setInput("");
      setNeedsLocation(false);
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, role: "user", content: message },
      ]);
      setSending(true);

      try {
        const { data, error } = await supabase.functions.invoke("ai-job-assistant", {
          body: { message: outgoing },
        });

        if (error) {
          const detail = await (error as any)?.context?.text?.().catch(() => "");
          let msg = "The assistant could not reply. Please try again.";
          try {
            const parsed = JSON.parse(detail || "{}");
            if (parsed?.error) msg = parsed.error;
          } catch {
            /* keep default */
          }
          throw new Error(msg);
        }
        if (data?.error) throw new Error(data.error);

        const reply = data?.reply as string;
        setMessages((prev) => [
          ...prev,
          { id: `reply-${Date.now()}`, role: "assistant", content: reply },
        ]);
        if (voiceOn) speak(reply);
      } catch (err: any) {
        toast.error("Assistant unavailable", { description: err?.message });
      } finally {
        setSending(false);
      }
    },
    [sending, user, voiceOn, speak, stopAudio, myLocation],
  );

  const detectLocation = useCallback(async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const place = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setMyLocation(place);
      setNeedsLocation(false);
      toast.success(`Location detected: ${place}`);
      return place;
    } catch (err: any) {
      toast.error("Could not detect your location", {
        description:
          err?.code === 1
            ? "Please allow location access in your browser and try again."
            : (err?.message ?? "Please type your city instead."),
      });
      return null;
    } finally {
      setLocating(false);
    }
  }, []);

  const sendNearMe = useCallback(async () => {
    const place = myLocation ?? (await detectLocation());
    if (!place) return;
    setNeedsLocation(false);
    stopAudio();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: `Jobs near me (${place})` },
    ]);
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-job-assistant", {
        body: { message: `Show part time jobs near my current location: ${place}` },
      });
      if (error) throw new Error("The assistant could not reply. Please try again.");
      if (data?.error) throw new Error(data.error);
      const reply = data?.reply as string;
      setMessages((prev) => [
        ...prev,
        { id: `reply-${Date.now()}`, role: "assistant", content: reply },
      ]);
      if (voiceOn) speak(reply);
    } catch (err: any) {
      toast.error("Assistant unavailable", { description: err?.message });
    } finally {
      setSending(false);
    }
  }, [myLocation, detectLocation, stopAudio, voiceOn, speak]);


  const toggleMic = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast.error("Voice input not supported", {
        description: "Please use Chrome on Android or desktop for voice.",
      });
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    stopAudio();
    const recognition = new SR();
    recognition.lang = voiceLang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setInput(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        setListening(false);
        send(transcript);
      }
    };
    recognition.onerror = () => {
      setListening(false);
      toast.error("Could not hear you", { description: "Please allow microphone access." });
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, send, stopAudio, voiceLang]);

  const clearChat = useCallback(async () => {
    stopAudio();
    setMessages([]);
    if (!user) return;
    const { error } = await supabase.from("ai_chat_messages").delete().eq("user_id", user.id);
    if (error) {
      console.error("Failed to clear chat", error);
      toast.error("Could not clear the chat");
    }
  }, [user, stopAudio]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-14 rounded-full px-5 shadow-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        aria-label="Open AI Job Assistant"
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        AI Assist
      </Button>

      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) stopAudio();
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <img
                src={assistantLogo}
                alt="Part Time Paisa AI assistant"
                width={512}
                height={512}
                loading="lazy"
                className="h-10 w-10 object-contain"
              />
              <div className="flex-1 text-left">
                <SheetTitle className="text-base">AI Job Assistant</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  Ask in English, Hindi, Hinglish or Telugu
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (voiceOn) stopAudio();
                  setVoiceOn(!voiceOn);
                }}
                aria-label={voiceOn ? "Turn voice replies off" : "Turn voice replies on"}
              >
                {voiceOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                aria-label="Clear conversation"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Hi! I can find part-time jobs for you, explain how to apply, or help you post a
                  job. Try one of these:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) =>
                    NEAR_ME.test(s) ? (
                      <Button key={s} variant="outline" size="sm" onClick={sendNearMe}>
                        <MapPin className="mr-1 h-4 w-4" />
                        {s}
                      </Button>
                    ) : (
                      <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>
                        {s}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            )}

            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div
                  key={m.id}
                  className="prose prose-sm max-w-none text-foreground dark:prose-invert"
                >
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ),
            )}

            {needsLocation && (
              <div className="rounded-xl border bg-muted/50 p-3">
                <p className="mb-2 text-sm">
                  To show jobs near you, I need your area. Detect it automatically or type your
                  city.
                </p>
                <Button size="sm" onClick={sendNearMe} disabled={locating}>
                  {locating ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="mr-1 h-4 w-4" />
                  )}
                  Detect my current location
                </Button>
              </div>
            )}

            {sending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}
            {speaking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Volume2 className="h-4 w-4 animate-pulse" />
                Speaking...
              </div>
            )}
          </div>

          <div className="border-t p-3">
            {!user && (
              <p className="mb-2 text-center text-xs text-muted-foreground">
                Please login to chat with the assistant.
              </p>
            )}
            <div className="mb-2 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={sendNearMe}
                disabled={locating || sending}
              >
                {locating ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-1 h-4 w-4" />
                )}
                {myLocation ? `Jobs near ${myLocation}` : "Use my current location"}
              </Button>
              {myLocation && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMyLocation(null)}
                  className="text-xs text-muted-foreground"
                >
                  Change
                </Button>
              )}
            </div>
            <div className="mb-2 flex items-center gap-1">
              <span className="mr-1 text-xs text-muted-foreground">Speak in:</span>
              {VOICE_LANGS.map((l) => (
                <Button
                  key={l.code}
                  type="button"
                  size="sm"
                  variant={voiceLang === l.code ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                  onClick={() => setVoiceLang(l.code)}
                >
                  {l.label}
                </Button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={listening ? "Listening..." : "Ask anything..."}
                rows={1}
                className="max-h-32 min-h-[44px] resize-none"
              />
              <Button
                type="button"
                variant={listening ? "destructive" : "outline"}
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={toggleMic}
                aria-label={listening ? "Stop listening" : "Speak your question"}
              >
                {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-11 w-11 shrink-0 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                disabled={sending || !input.trim()}
                onClick={() => send(input)}
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AiJobAssistant;
