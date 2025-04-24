import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CustomConnectButton from '../common/CustomConnectButton';
import useEscrow from '../../hooks/useEscrow';

interface FormData {
  freelancerAddress: string;
  description: string;
  amount: string;
  endDate: string;
}

const ContractCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, address, createContract } = useEscrow();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    freelancerAddress: '',
    description: '',
    amount: '',
    endDate: '',
  });
  
  // Form validation state
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  // Focus description field when first loaded
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, []);
  
  // Calculate form progress
  useEffect(() => {
    let progress = 0;
    const fields = Object.keys(formData) as Array<keyof FormData>;
    
    for (const field of fields) {
      if (formData[field]) {
        progress += 25; // 4 fields, each worth 25%
      }
    }
    
    setFormProgress(progress);
  }, [formData]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
    
    // Clear error for this field if it exists
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Handle blur event for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    validateField(name as keyof FormData);
  };
  
  // Validate individual field
  const validateField = (field: keyof FormData) => {
    let error = '';
    
    switch (field) {
      case 'freelancerAddress':
        if (!formData.freelancerAddress) {
          error = 'Freelancer address is required';
        } else if (!/^0x[a-fA-F0-9]{40,64}$/.test(formData.freelancerAddress)) {
          error = 'Invalid Sui address format';
        } else if (formData.freelancerAddress === address) {
          error = 'You cannot create a contract with yourself';
        }
        break;
      
      case 'description':
        if (!formData.description) {
          error = 'Project description is required';
        } else if (formData.description.length < 10) {
          error = 'Description must be at least 10 characters';
        }
        break;
      
      case 'amount':
        if (!formData.amount) {
          error = 'Total amount is required';
        } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
          error = 'Amount must be a valid positive number';
        }
        break;
      
      case 'endDate':
        if (!formData.endDate) {
          error = 'Project deadline is required';
        } else {
          const selectedDate = new Date(formData.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (selectedDate <= today) {
            error = 'Deadline must be in the future';
          }
        }
        break;
    }
    
    if (error) {
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
      return false;
    }
    
    return true;
  };
  
  // Validate all fields
  const validateForm = () => {
    const fields = Object.keys(formData) as Array<keyof FormData>;
    let isValid = true;
    
    for (const field of fields) {
      const fieldIsValid = validateField(field);
      if (!fieldIsValid) isValid = false;
    }
    
    return isValid;
  };
  
  // Navigate through form steps
  const goToNextStep = () => {
    if (currentStep === 1) {
      const isValid = validateField('freelancerAddress') && validateField('description');
      if (!isValid) {
        setTouched({
          freelancerAddress: true,
          description: true,
          amount: touched.amount,
          endDate: touched.endDate
        });
        return;
      }
    }
    
    setCurrentStep(prev => prev + 1);
  };
  
  const goToPreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      freelancerAddress: true,
      description: true,
      amount: true,
      endDate: true
    });
    
    const isValid = validateForm();
    
    if (!isValid) {
      return;
    }
    
    // In ContractCreationForm.tsx, enhance error handling
    try {
      setIsSubmitting(true);
      
      const result = await createContract(
        formData.freelancerAddress,
        formData.description,
        formData.amount,
        formData.endDate
      );
      
      if (result.success) {
        // Set transaction hash for display in success message
        setTransactionHash(result.txDigest || null);
        
        // Store contract ID if available
        // if (result.escrowId) {
        //   console.log("Contract created with ID:", result.escrowId);
        // }
        
        // Show success message and then redirect
        setShowSuccessMessage(true);
        
        setTimeout(() => {
          navigate('/client-dashboard');
        }, 3000);
      } else {
        // Handle error
        console.error('Error creating contract:', result.error);
        setErrors(prev => ({
          ...prev,
          description: result.error || 'Failed to create contract. Please try again.'
        }));
        setIsSubmitting(false);
      }
    } catch (error) {
        console.error('Error creating contract:', error);
        let errorMessage = 'Failed to create contract. Please try again.';
        
        if (error instanceof Error) {
          if (error.message.includes("InsufficientCoinBalance")) {
            errorMessage = "You don't have enough SUI in a single coin object. Try consolidating your coins first or using a smaller amount.";
          } else if (error.message.includes("GasBalanceTooLow")) {
            errorMessage = "Gas balance too low. Please ensure you have enough SUI for transaction fees.";
          } else {
            errorMessage = error.message;
          }
        }
        
        setErrors(prev => ({
          ...prev,
          description: errorMessage
        }));
        setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              You need to connect your wallet to create a new escrow contract.
            </p>
            <CustomConnectButton
                variant="primary"
                size="lg"
                label="Connect Wallet"
                className="shadow-md transition-colors"
            />
          </div>
        </div>
      </div>
    );
  }

  if (showSuccessMessage) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract Created Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your escrow contract has been created and funds have been locked in the smart contract.
            You'll be redirected to your dashboard in a moment.
          </p>
          {transactionHash && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-mono text-xs text-gray-800 break-all">{transactionHash}</p>
              </div>
              <a 
                href={`https://suiscan.xyz/testnet/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
              >
                View on Explorer
              </a>
            </div>
          )}
          <div className="animate-pulse text-indigo-600 font-medium">
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Form header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 sm:px-10">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-2xl font-bold text-white">Create Escrow Contract</h2>
              <p className="text-indigo-100 mt-1">Secure milestone-based payments for freelancers</p>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`h-2.5 w-2.5 rounded-full ${currentStep >= 1 ? 'bg-white' : 'bg-indigo-300'}`}></div>
              <div className="h-px w-3 bg-indigo-300"></div>
              <div className={`h-2.5 w-2.5 rounded-full ${currentStep >= 2 ? 'bg-white' : 'bg-indigo-300'}`}></div>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="bg-gray-50 px-6 py-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${formProgress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Form content */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-10">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    ref={descriptionRef}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.description && touched.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`}
                    placeholder="Describe the project and expectations..."
                    value={formData.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.description && touched.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Clear descriptions help freelancers understand project requirements.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="freelancerAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Freelancer Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="freelancerAddress"
                      name="freelancerAddress"
                      className={`w-full px-4 py-3 rounded-lg border ${errors.freelancerAddress && touched.freelancerAddress ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} shadow-sm pl-10 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors font-mono text-sm`}
                      placeholder="0x..."
                      value={formData.freelancerAddress}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  {errors.freelancerAddress && touched.freelancerAddress && (
                    <p className="mt-1 text-sm text-red-600">{errors.freelancerAddress}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the full Sui address of the freelancer.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center"
                >
                  <span>Continue</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
          
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount (SUI)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="amount"
                      name="amount"
                      className={`w-full px-4 py-3 rounded-lg border ${errors.amount && touched.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} shadow-sm pl-10 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`}
                      placeholder="0.0"
                      value={formData.amount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  {errors.amount && touched.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    This amount will be locked in the smart contract.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Deadline
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      className={`w-full px-4 py-3 rounded-lg border ${errors.endDate && touched.endDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} shadow-sm pl-10 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`}
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.endDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  {errors.endDate && touched.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    The final date by which all project milestones should be completed.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mt-8 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Contract Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project:</span>
                    <span className="text-gray-900 font-medium">
                      {formData.description ? (
                        formData.description.length > 30 
                          ? formData.description.substring(0, 30) + '...' 
                          : formData.description
                      ) : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Freelancer:</span>
                    <span className="text-gray-900 font-medium font-mono">
                      {formData.freelancerAddress 
                        ? `${formData.freelancerAddress.substring(0, 6)}...${formData.freelancerAddress.substring(formData.freelancerAddress.length - 4)}`
                        : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="text-gray-900 font-medium">
                      {formData.amount ? `${formData.amount} SUI` : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="text-gray-900 font-medium">
                      {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Back</span>
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Contract on Blockchain...
                    </>
                  ) : (
                    <>
                      <span>Create Contract</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </form>
        
        {/* Informational box at bottom */}
        <div className="bg-gray-50 px-6 py-4 sm:px-10 border-t border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">
                After creating the contract, you'll need to add milestones through the contract details page. 
                Funds will be locked in the smart contract until milestones are approved and completed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractCreationForm;
