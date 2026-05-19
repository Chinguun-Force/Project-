"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { characters, countries } from "@/data/characters";
import { User, Check, Mail, Lock, Calendar, MapPin, ChevronRight, ChevronLeft } from "lucide-react";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    playerName: "",
    character: "",
    trait: "",
    origin: "",
    age: "",
  });
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleNext = () => {
    if (step === 1) {
      if (!formData.playerName) {
        toast.error("Please enter a player name");
        return;
      }
      if (!formData.character) {
        toast.error("Please choose a character");
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.age || !formData.origin) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const { error, success } = await signup({
      ...formData,
      age: parseInt(formData.age, 10)
    });
    setLoading(false);

    if (error) {
      toast.error(error);
    } else if (success) {
      toast.success("Successfully signed up! Redirecting...");
      router.push("/map");
    }
  };

  const selectedCharacter = characters.find((c) => c.id === formData.character);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1D26] p-4 font-sans">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Your Legend</h1>
          <p className="text-[#A0A0B0]">Join Nomad-Go and start exploring</p>
          
          {/* Progress Bar */}
          <div className="flex gap-2 justify-center mt-6">
            <div className={`h-1.5 w-12 rounded-full transition-colors ${step >= 1 ? 'bg-[#A8C69F]' : 'bg-[#322F36]'}`} />
            <div className={`h-1.5 w-12 rounded-full transition-colors ${step >= 2 ? 'bg-[#A8C69F]' : 'bg-[#322F36]'}`} />
          </div>
        </div>

        <div className="bg-[#322F36] border border-[#322F36]/50 shadow-2xl rounded-2xl overflow-hidden relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="p-6 space-y-6"
              >
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Player Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <Input
                      placeholder="Your adventure name"
                      value={formData.playerName}
                      onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                      className="bg-[#1A1D26] border-gray-700 text-white pl-10 placeholder:text-gray-500 focus-visible:ring-[#A8C69F]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-300 text-sm">Choose Your Class</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {characters.map((character) => (
                      <button
                        key={character.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, character: character.id, trait: character.trait })}
                        className={`p-4 rounded-xl border-2 transition-all text-left relative flex flex-col items-center text-center ${
                          formData.character === character.id
                            ? "border-[#A8C69F] bg-[#A8C69F]/10 shadow-[0_0_15px_rgba(168,198,159,0.15)]"
                            : "border-gray-700 bg-[#1A1D26] hover:border-[#A8C69F]/50 hover:bg-[#1A1D26]/80"
                        }`}
                      >
                        <div className="text-3xl mb-2">{character.icon}</div>
                        <h4 className="text-white text-sm font-semibold mb-1">{character.name}</h4>
                        <p className="text-xs text-gray-400 line-clamp-2">{character.description}</p>
                        
                        {formData.character === character.id && (
                          <div className="absolute top-2 right-2 text-[#A8C69F] bg-[#A8C69F]/20 rounded-full p-0.5">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCharacter && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#A8C69F]/10 border border-[#A8C69F]/30 rounded-xl p-3 flex gap-2 items-center"
                  >
                    <span className="text-xl">{selectedCharacter.icon}</span>
                    <div>
                      <p className="text-[#A8C69F] text-xs font-semibold uppercase tracking-wider">Passive Trait</p>
                      <p className="text-white text-sm">{selectedCharacter.trait}</p>
                    </div>
                  </motion.div>
                )}

                <Button
                  onClick={handleNext}
                  className="w-full bg-[#A8C69F] hover:bg-[#8eb084] text-[#1A1D26] font-bold rounded-xl py-6"
                >
                  Continue <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Age</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <Input
                        type="number"
                        placeholder="25"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="bg-[#1A1D26] border-gray-700 text-white pl-9 placeholder:text-gray-500 focus-visible:ring-[#A8C69F]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Origin</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <select
                        value={formData.origin}
                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                        className="w-full bg-[#1A1D26] border border-gray-700 rounded-md pl-9 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#A8C69F] appearance-none"
                      >
                        <option value="" disabled>Select</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <Input
                      type="email"
                      placeholder="nomad@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-[#1A1D26] border-gray-700 text-white pl-10 placeholder:text-gray-500 focus-visible:ring-[#A8C69F]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-[#1A1D26] border-gray-700 text-white pl-10 placeholder:text-gray-500 focus-visible:ring-[#A8C69F]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-[#1A1D26] hover:text-white"
                  >
                    <ChevronLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button
                    onClick={handleSignup}
                    disabled={loading}
                    className="flex-1 bg-[#A8C69F] hover:bg-[#8eb084] text-[#1A1D26] font-bold"
                  >
                    {loading ? "Signing up..." : "Complete Setup"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-[#A8C69F] font-semibold hover:underline">
              Log in here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
