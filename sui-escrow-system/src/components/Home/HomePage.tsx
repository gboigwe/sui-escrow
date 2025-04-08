import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

const HomePage: React.FC = () => {
  const { isConnected, connect } = useWallet();
  
  // Intersection observers for animations
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const userRolesRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.3 });
  const userRolesInView = useInView(userRolesRef, { once: true, amount: 0.3 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.5 });
  
  // Parallax effects
  const { scrollYProgress } = useScroll();
  const bgYTransform = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  
  // Contract preview animation
  const [animateMilestones, setAnimateMilestones] = useState({
    design: 0,
    development: 0,
    testing: 0
  });
  
  useEffect(() => {
    // Animate milestones when hero section is in view
    if (heroInView) {
      const designTimer = setTimeout(() => {
        setAnimateMilestones(prev => ({ ...prev, design: 100 }));
      }, 1000);
      
      const devTimer = setTimeout(() => {
        setAnimateMilestones(prev => ({ ...prev, development: 50 }));
      }, 2000);
      
      return () => {
        clearTimeout(designTimer);
        clearTimeout(devTimer);
      };
    }
  }, [heroInView]);

  return (
    <main className="relative overflow-hidden">
      {/* Background elements with parallax effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          className="absolute top-0 left-0 right-0 -z-10"
          style={{ y: bgYTransform }}
        >
          <div className="absolute top-0 -right-[10%] w-[70%] h-[50rem] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl transform rotate-12 opacity-70"></div>
          <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[30rem] bg-gradient-to-br from-blue-100/20 to-cyan-100/20 rounded-full blur-3xl"></div>
        </motion.div>
        <div className="absolute bottom-[20%] right-[5%] w-[20%] h-[20rem] bg-gradient-to-br from-amber-100/20 to-rose-100/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[10%] left-[30%] w-[50%] h-[40rem] bg-gradient-to-br from-indigo-100/20 to-purple-100/20 rounded-full blur-3xl transform -rotate-12"></div>
      </div>
      
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={heroInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.7 }}
        className="relative pt-12 pb-20 md:min-h-[90vh] flex items-center"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left column - Hero text and CTA */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 mb-6">
                <span className="h-2 w-2 rounded-full bg-indigo-500 mr-2"></span>
                <span className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Powered by Sui Blockchain
                </span>
              </div>
              
              <h1 className="font-extrabold text-5xl md:text-6xl xl:text-7xl tracking-tight mb-6 leading-[1.1]">
                <span className="block text-gray-900">Secure</span>
                <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">Decentralized</span>
                <span className="block text-gray-900">Escrow Payments</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
                Enable trustless milestone-based payment contracts between clients and freelancers. No middlemen, no platform fees, just secure transactions on the Sui blockchain.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-12">
                {isConnected ? (
                  <Link 
                    to="/create-contract" 
                    className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl shadow-indigo-200/40 hover:shadow-indigo-200/60 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                    </svg>
                    Create Contract
                  </Link>
                ) : (
                  <button 
                    onClick={connect}
                    className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl shadow-indigo-200/40 hover:shadow-indigo-200/60 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                    </svg>
                    Connect Wallet
                  </button>
                )}
                
                <Link 
                  to={isConnected ? "/client-dashboard" : "/freelancer-dashboard"} 
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium text-indigo-700 bg-white ring-1 ring-indigo-100 hover:ring-indigo-200 shadow-lg shadow-indigo-100/20 hover:shadow-indigo-100/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  View Dashboard
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">100% Secure</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">0% Platform Fees</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Fast Settlement</span>
                </div>
              </div>
            </motion.div>
            
            {/* Right column - Contract preview */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="relative"
            >
              {/* Glowing orbs */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-300/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl"></div>
              
              {/* Contract Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 backdrop-blur-sm">
                {/* Card gradient border */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30"></div>
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30"></div>
                  <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-indigo-500 to-transparent opacity-30"></div>
                  <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-purple-500 to-transparent opacity-30"></div>
                </div>
                
                {/* Card Header */}
                <div className="p-1">
                  <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-3xl border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">SuiEscrow Contract</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-6">
                    <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-800">Website Redesign Contract</h3>
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100 flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                          Active
                        </span>
                      </div>
                      
                      <div className="space-y-2.5 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Client:</span>
                          <span className="text-xs text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">0x7A3B...F42D</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Freelancer:</span>
                          <span className="text-xs text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">0x1D4F...8E3C</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Total Amount:</span>
                          <span className="text-xs text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">5.000 SUI</span>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-medium text-gray-700 mb-3">Milestone Progress</h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-gray-600">Design Phase</span>
                              <span className="text-green-600 font-medium">Completed</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: `${animateMilestones.design}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                              ></motion.div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-gray-600">Development</span>
                              <span className="text-blue-600 font-medium">In Progress</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: `${animateMilestones.development}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                              ></motion.div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-gray-600">Testing & Deployment</span>
                              <span className="text-gray-600 font-medium">Pending</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: `${animateMilestones.testing}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                              ></motion.div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                        <span className="text-xs text-gray-500">Last updated: 2h ago</span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                        Secured by Sui
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
      
      {/* How It Works Section */}
      <section 
        ref={featuresRef}
        className="relative py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              <span className="relative">
                <span className="absolute -bottom-2 -right-1 left-2 h-3 bg-indigo-100 -z-10 rounded-lg"></span>
                How SuiEscrow Works
              </span>
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Our platform ensures secure transactions between clients and freelancers through smart contracts on the Sui blockchain.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 z-0"></div>
            
            {/* Feature 1 */}
            <motion.div 
              className="relative z-10"
              initial={{ opacity: 0, y: 50 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-50 p-8 h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-center -mt-16 mb-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xl font-semibold shadow-lg">1</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Create Contract</h3>
                <p className="text-gray-600 mb-6 text-center">Client creates an escrow contract with defined milestones and locks funds in the smart contract.</p>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Funds securely locked in contract</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Define clear milestones and terms</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              className="relative z-10 md:mt-12"
              initial={{ opacity: 0, y: 50 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-50 p-8 h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-center -mt-16 mb-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-semibold shadow-lg">2</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Submit Work</h3>
                <p className="text-gray-600 mb-6 text-center">Freelancer completes work for each milestone and submits for client review and approval.</p>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Track progress with milestones</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Transparent submission process</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div 
              className="relative z-10"
              initial={{ opacity: 0, y: 50 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-50 p-8 h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-center -mt-16 mb-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xl font-semibold shadow-lg">3</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Receive Payment</h3>
                <p className="text-gray-600 mb-6 text-center">Client approves work and the smart contract automatically releases payment to the freelancer.</p>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Instant automatic payments</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>No hidden fees or delays</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* User Roles Section */}
      <section 
        ref={userRolesRef}
        className="relative py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50"
      >
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 -z-10 skew-x-12 transform-gpu opacity-70"></div>
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-l from-indigo-50/50 to-purple-50/50 -z-10 -skew-x-12 transform-gpu opacity-70"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={userRolesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Choose Your Role</h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Whether you're hiring talent or offering services, SuiEscrow provides the security and tools you need.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
            {/* Client Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={userRolesInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 h-full border border-gray-100 group-hover:border-indigo-100">
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-indigo-600 group-hover:h-3 transition-all duration-300"></div>
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-indigo-200 transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">For Clients</h3>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">Create escrow contracts with clearly defined milestones and deadlines</p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">Review and approve completed work with confidence</p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">Track project progress through an intuitive dashboard</p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">Your funds remain secure in smart contract until work is approved</p>
                    </div>
                  </div>
                  
                  <Link 
                    to="/client-dashboard" 
                    className="relative overflow-hidden inline-block w-full py-4 px-6 text-center text-white font-medium bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300"
                  >
                    <span className="relative z-10">Client Dashboard</span>
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-indigo-600 to-indigo-700 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></div>
                  </Link>
                </div>
              </div>
            </motion.div>
            
            {/* Freelancer Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={userRolesInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 h-full border border-gray-100 group-hover:border-purple-100">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600 group-hover:h-3 transition-all duration-300"></div>
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-purple-200 transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">For Freelancers</h3>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">View and accept contracts with clearly defined deliverables</p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">Submit completed milestones for review and approval</p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">Receive automatic payments as soon as work is approved</p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">Build a verifiable portfolio of completed projects</p>
                    </div>
                  </div>
                  
                  <Link 
                    to="/freelancer-dashboard" 
                    className="relative overflow-hidden inline-block w-full py-4 px-6 text-center text-white font-medium bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300"
                  >
                    <span className="relative z-10">Freelancer Dashboard</span>
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-purple-600 to-purple-700 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section 
        ref={statsRef}
        className="py-20 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            {/* Stat 1 */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">100%</div>
                <div className="text-gray-600">Secure Escrow</div>
              </div>
            </div>
            
            {/* Stat 2 */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">0%</div>
                <div className="text-gray-600">Platform Fees</div>
              </div>
            </div>
            
            {/* Stat 3 */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">&lt;2s</div>
                <div className="text-gray-600">Payment Speed</div>
              </div>
            </div>
            
            {/* Stat 4 */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">24/7</div>
                <div className="text-gray-600">Always Available</div>
              </div>
            </div>
          </motion.div>
          
          {/* Dispute Resolution Feature */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl transform rotate-1 scale-105 opacity-70 -z-10"></div>
            <div className="absolute inset-0 bg-white rounded-3xl shadow-lg -z-10"></div>
            
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="lg:flex">
                <div className="lg:w-1/2 p-8 lg:p-12">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-50 border border-purple-100 mb-6">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse mr-2"></span>
                    <span className="text-sm font-medium text-purple-700">Secure Dispute Resolution</span>
                  </div>
                  
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                    Fair & Transparent Dispute Resolution
                  </h3>
                  
                  <p className="text-gray-700 mb-6 lg:text-lg">
                    In the rare case of disagreements, our community-powered dispute resolution system ensures fair outcomes for both parties through transparent blockchain voting.
                  </p>
                  
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center text-gray-700">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Community-driven voting system</span>
                    </li>
                    <li className="flex items-center text-gray-700">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Immutable evidence on blockchain</span>
                    </li>
                    <li className="flex items-center text-gray-700">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Fair & transparent resolution</span>
                    </li>
                  </ul>
                </div>
                
                <div className="lg:w-1/2 p-8 lg:p-12 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 w-full max-w-md transform hover:scale-105 transition-all duration-300">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-900">Dispute #127</h4>
                      <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full border border-yellow-100 flex items-center">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5 animate-pulse"></span>
                        In Progress
                      </span>
                    </div>
                    
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Client Votes</span>
                          <span className="text-sm font-medium text-indigo-600">6 votes</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-2.5 rounded-full w-[40%]"></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Freelancer Votes</span>
                          <span className="text-sm font-medium text-purple-600">9 votes</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2.5 rounded-full w-[60%]"></div>
                        </div>
                      </div>
                      
                      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Voting ends in 3 days</span>
                        <button className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors">Cast Vote</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section 
        ref={ctaRef}
        className="relative py-20 z-10 overflow-hidden"
      >
        {/* Abstract background with multiple layers and animations */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-600 to-purple-700 opacity-90"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent opacity-20"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent opacity-20"></div>
          
          {/* Animated circles */}
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-pink-500 rounded-full opacity-10 animate-pulse"></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48cGF0aCBkPSJNMiAyaDU2djU2SDJ6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIuMSIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
        </div>
        
        <motion.div 
          className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10"
          initial={{ opacity: 0, y: 50 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8">
            Start Your First Secure Escrow Contract Today
          </h2>
          
          <p className="text-xl text-indigo-100 mb-10 max-w-3xl mx-auto">
            Join thousands of clients and freelancers who are using SuiEscrow to handle payments securely and efficiently.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            {isConnected ? (
              <Link 
                to="/create-contract" 
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-indigo-700 bg-white font-medium text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                </svg>
                Create Your First Contract
              </Link>
            ) : (
              <button 
                onClick={connect}
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-indigo-700 bg-white font-medium text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                </svg>
                Connect Wallet
              </button>
            )}
            
            <Link 
              to="/"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-white bg-transparent border-2 border-white/50 font-medium text-lg hover:bg-white/10 transform hover:-translate-y-1 transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Learn More
            </Link>
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-8">
            <div className="flex items-center text-indigo-100 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-200" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Sui Blockchain Powered
            </div>
            
            <div className="flex items-center text-indigo-100 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-200" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Built for Sui Overflow 2025
            </div>
            
            <div className="flex items-center text-indigo-100 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-200" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
              Community Driven
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
};

export default HomePage;
