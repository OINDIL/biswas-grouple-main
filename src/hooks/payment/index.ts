"use client"
import {
    onCreateNewGroup,
    onGetGroupChannels,
    onGetGroupSubscriptions,
    onJoinGroup,
} from "@/actions/groups"
import {
    onActivateSubscription,
    onCreateNewGroupSubscription,
    onGetActiveSubscription,
    onGetStripeClientSecret,
    onGetSubscriptionPaymentIntent,
    onTransferCommission,
    onVerifyRazorpayPayment
} from "@/actions/payments"
import { CreateGroupSchema } from "@/components/forms/create-group/schema"
import { CreateGroupSubscriptionSchema } from "@/components/forms/subscription/schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { StripeCardElement, loadStripe } from "@stripe/stripe-js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const useStripeElements = () => {
  const StripePromise = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY) {
      throw new Error('Stripe publishable key is not configured');
    }
    return await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY);
  }, []);

  return { StripePromise };
}

interface BaseResponse {
  status: number;
  message?: string;
}

interface StripeSuccessResponse extends BaseResponse {
  status: 200;
  secret: string;
  paymentIntentId: string;
}

interface StripeErrorResponse extends BaseResponse {
  status: 400 | 404 | 500;
  message: string;
}

interface RazorpaySuccessResponse extends BaseResponse {
  status: 200;
  orderId: string;
  amount: number;
  currency: string;
}

interface RazorpayErrorResponse extends BaseResponse {
  status: 400 | 404 | 500;
  message: string;
}

type StripeResponse = StripeSuccessResponse | StripeErrorResponse;
type RazorpayResponse = RazorpaySuccessResponse | RazorpayErrorResponse;

const isStripeSuccess = (response: unknown): response is StripeSuccessResponse => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    (response as any).status === 200 &&
    'secret' in response &&
    typeof (response as any).secret === 'string' &&
    'paymentIntentId' in response &&
    typeof (response as any).paymentIntentId === 'string'
  );
};

const isRazorpaySuccess = (response: unknown): response is RazorpaySuccessResponse => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    (response as any).status === 200 &&
    'orderId' in response &&
    'amount' in response &&
    'currency' in response
  );
};

export const usePayments = (
  userId: string,
  affiliate: boolean,
  stripeId?: string,
) => {
  const [isCategory, setIsCategory] = useState<string | undefined>(undefined)
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const {
    reset,
    handleSubmit,
    formState: { errors },
    register,
    watch,
  } = useForm<z.infer<typeof CreateGroupSchema>>({
    resolver: zodResolver(CreateGroupSchema),
    defaultValues: {
      category: "",
    },
  })

  useEffect(() => {
    const category = watch(({ category }) => {
      if (category) {
        setIsCategory(category)
      }
    })
    return () => category.unsubscribe()
  }, [watch])

  const { data: Intent } = useQuery({
    queryKey: ["payment-intent"],
    queryFn: () => onGetStripeClientSecret(0), // Default amount, should be updated with actual amount
  })

  const { mutateAsync: createGroup, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof CreateGroupSchema>) => {
      if (!stripe || !elements || !Intent) {
        return null
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        //@ts-ignore
        (Intent as StripeResponse).secret!,
        {
          payment_method: {
            card: elements.getElement(CardElement) as StripeCardElement,
          },
        },
      )

      if (error) {
        return toast("Error", {
          description: "Oops! something went wrong, try again later",
        })
      }

      if (paymentIntent?.status === "succeeded") {
        if (affiliate && stripeId) {
          await onTransferCommission(0, stripeId) // Amount should be calculated based on your business logic
        }
        const created = await onCreateNewGroup(userId, data)
        if (created && created.status === 200) {
          toast("Success", {
            description: created.message,
          })
          router.push(
            `/group/${created.data?.group[0].id}/channel/${created.data?.group[0].channel[0].id}`,
          )
        }
        if (created && created.status !== 200) {
          reset()
          return toast("Error", {
            description: created.message,
          })
        }
      }
    },
  })

  const onCreateGroup = handleSubmit(async (values) => createGroup(values))

  return {
    onCreateGroup,
    isPending,
    register,
    errors,
    isCategory,
    creatingIntent: false, // This is a placeholder, as the original code didn't include a creatingIntent field
  }
}

export const useActiveGroupSubscription = (groupId: string) => {
  const { data } = useQuery({
    queryKey: ["active-subscription"],
    queryFn: () => onGetActiveSubscription(groupId),
  })

  return { data }
}

export const useJoinFree = (groupid: string) => {
  const router = useRouter()
  const onJoinFreeGroup = async () => {
    const member = await onJoinGroup(groupid)
    if (member?.status === 200) {
      const channels = await onGetGroupChannels(groupid)
      router.push(`/group/${groupid}/channel/${channels?.channels?.[0].id}`)
    }
  }

  return { onJoinFreeGroup }
}

export const usePaymentMethod = (groupId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ["payment-method", groupId];

  const { data: paymentMethod = "stripe" } = useQuery({
    queryKey,
    queryFn: () => "stripe" as "stripe" | "razorpay",
    staleTime: Infinity,
  });

  const { mutate: setPaymentMethod } = useMutation({
    mutationFn: (method: "stripe" | "razorpay") => {
      return Promise.resolve(method);
    },
    onSuccess: (method) => {
      queryClient.setQueryData(queryKey, method);
    },
  });

  return {
    paymentMethod,
    setPaymentMethod,
  };
};

export const useRazorpayPayment = (groupId: string) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: Intent, isLoading: isLoadingIntent } = useQuery({
    queryKey: ["group-payment-intent", groupId, "razorpay"],
    queryFn: async () => {
      const response = await onGetSubscriptionPaymentIntent(groupId, "razorpay");
      return response;
    },
    enabled: !!groupId && !isProcessing,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1
  });
  const { mutate, isPending } = useMutation<string>({
    mutationFn: async () => {
      try {
        if (isProcessing) {
          throw new Error("Payment is already in progress");
        }

        setIsProcessing(true);

        if (!window.Razorpay) {
          throw new Error("Razorpay not initialized");
        }

        if (!Intent) {
          throw new Error("Could not create payment session");
        }

        if (!isRazorpaySuccess(Intent)) {
          throw new Error(Intent.message || "Invalid payment session");
        }

        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
          throw new Error("Razorpay key not configured");
        }

        return new Promise((resolve, reject) => {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: Intent.amount,
            currency: Intent.currency,
            name: "Biswas Grouple",
            description: "Group Subscription Payment",
            order_id: Intent.orderId,
            handler: async function (response: any) {
              try {
                const result = await onVerifyRazorpayPayment(
                  response.razorpay_payment_id,
                  response.razorpay_order_id,
                  response.razorpay_signature
                );

                if (result.status === 200) {
                  const member = await onJoinGroup(groupId);
                  
                  if (member?.status === 200) {
                    const channels = await onGetGroupChannels(groupId);
                    
                    if (channels?.channels?.[0]?.id) {
                      toast.success("Payment successful!");
                      router.push(`/group/${groupId}/channel/${channels.channels[0].id}`);
                      resolve(channels.channels[0].id);
                    } else {
                      reject(new Error("No channels found"));
                    }
                  } else {
                    reject(new Error("Failed to join group"));
                  }
                } else {
                  reject(new Error("Payment verification failed"));
                }
              } catch (error) {
                reject(error);
              }
            },
            modal: {
              ondismiss: () => {
                reject(new Error("Payment cancelled"));
              },
              confirm_close: true,
              escape: false,
            },
            theme: {
              color: "#3399cc",
            },
            prefill: {
              name: "",
              email: "",
              contact: ""
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', (response: any) => {
            reject(new Error(response.error.description || "Payment failed"));
          });
          rzp.open();
        });
      } catch (error) {
        console.error("Payment processing error:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Payment failed");
    },
    onSuccess: (channelId: string) => {
      toast.success("Payment successful!");
      router.push(`/group/${groupId}/channel/${channelId}`);
    },
  });

  const onPayWithRazorpay = useCallback(() => {
    if (isProcessing) {
      toast.error("Payment is already in progress");
      return;
    }
    mutate();
  }, [isProcessing, mutate]);

  return { 
    onPayWithRazorpay, 
    isPending: isPending || isLoadingIntent || isProcessing,
    isProcessing 
  };
};

export const useJoinGroup = (groupId: string) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: Intent, error: intentError } = useQuery({
    queryKey: ["group-payment-intent", groupId, "stripe"],
    queryFn: () => onGetSubscriptionPaymentIntent(groupId, "stripe"),
    staleTime: 30000,
    retry: 1,
    enabled: !!groupId && !isProcessing
  });
  const { mutate, isPending } = useMutation<string>({
    mutationFn: async (): Promise<string> => {
      try {
        if (isProcessing) {
          throw new Error("Payment is already in progress");
        }

        setIsProcessing(true);

        if (!stripe || !elements) {
          throw new Error("Payment system not initialized");
        }

        if (!Intent) {
          throw new Error("Could not create payment session");
        }

        const stripeResponse = Intent as StripeResponse;
        if (!isStripeSuccess(stripeResponse)) {
          throw new Error(stripeResponse.message || "Invalid payment session");
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error("Card element not found");
        }

        setPaymentIntentId(stripeResponse.paymentIntentId);

        // First confirm the card payment
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          stripeResponse.secret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                email: "", // Add user's email if available
              },
            },
            return_url: window.location.origin + `/group/${groupId}/payment/success`,
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message || "Payment failed");
        }

        // Handle requires_action status - this will redirect to Stripe
        if (paymentIntent?.status === "requires_action") {
          const { error: actionError, paymentIntent: updatedIntent } = await stripe.handleCardAction(
            stripeResponse.secret
          );

          if (actionError) {
            throw new Error(actionError.message || "Payment authentication failed");
          }
          
          // This will redirect to Stripe's page, so we don't proceed further
          return updatedIntent?.id || "";
        }

        // Only proceed if payment is successful
        if (paymentIntent.status !== "succeeded") {
          throw new Error(`Payment unsuccessful: ${paymentIntent.status}`);
        }

        const member = await onJoinGroup(groupId);
        if (!member || member.status !== 200) {
          throw new Error("Failed to join group");
        }

        const channels = await onGetGroupChannels(groupId);
        if (!channels?.channels?.[0]?.id) {
          throw new Error("No channels found in group");
        }

        return channels.channels[0].id;
      } catch (error) {
        console.error("Payment processing error:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (error: Error) => {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed");
    },
    onSuccess: (channelId: string) => {
      toast.success("Payment successful!");
      router.push(`/group/${groupId}/channel/${channelId}`);
    },
  });

  const onPayToJoin = useCallback(() => {
    if (isProcessing) {
      toast.error("Payment is already in progress");
      return;
    }
    mutate();
  }, [isProcessing, mutate]);

  return {
    onPayToJoin,
    isPending: isPending || isProcessing,
    isProcessing,
    error: intentError
  };
};

export const useGroupSubscription = (groupId: string) => {
  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<z.infer<typeof CreateGroupSubscriptionSchema>>({
    resolver: zodResolver(CreateGroupSubscriptionSchema),
  });

  const client = useQueryClient();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: (data: { price: string }) =>
      onCreateNewGroupSubscription(groupId, parseFloat(data.price)),
    onMutate: () => reset(),
    onSuccess: (data) =>
      toast(data?.status === 200 ? "Success" : "Error", {
        description: data?.message,
      }),
    onSettled: async () => {
      return await client.invalidateQueries({
        queryKey: ["group-subscriptions"],
      });
    },
  });

  const onCreateNewSubscription = handleSubmit(async (values) =>
    mutate({ ...values }),
  );
  
  return { register, errors, onCreateNewSubscription, isPending, variables };
};

export const useAllSubscriptions = (groupid: string) => {
  const { data } = useQuery({
    queryKey: ["group-subscriptions"],
    queryFn: () => onGetGroupSubscriptions(groupid),
  })

  const client = useQueryClient()

  const { mutate } = useMutation({
    mutationFn: (data: { id: string }) => onActivateSubscription(data.id),
    onSuccess: (data) =>
      toast(data?.status === 200 ? "Success" : "Error", {
        description: data?.message,
      }),
    onSettled: async () => {
      return await client.invalidateQueries({
        queryKey: ["group-subscriptions"],
      })
    },
  })

  return { data, mutate }
}

export const useStripeConnect = (groupid: string) => {
  const [onStripeAccountPending, setOnStripeAccountPending] =
    useState<boolean>(false)

  const onStripeConnect = async () => {
    try {
      setOnStripeAccountPending(true)
      const account = await axios.get(`/api/stripe/connect?groupid=${groupid}`)
      if (account) {
        setOnStripeAccountPending(false)
        if (account) {
          window.location.href = account.data.url
        }
      }
    } catch (error) {
      console.log(error)
    }
  }
  return { onStripeConnect, onStripeAccountPending }
}

export const useRazorpayConnect = (groupId: string) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const onRazorpayConnect = async () => {
    try {
      setIsConnecting(true);
      // Open Razorpay onboarding in a new window
      window.open(`https://dashboard.razorpay.com/app/website-app-settings/api-keys`, '_blank');
      toast.info("Please complete Razorpay onboarding in the new window");
    } catch (error) {
      console.error("Razorpay Connect Error:", error);
      toast.error("Failed to connect to Razorpay");
    } finally {
      setIsConnecting(false);
    }
  };

  return { onRazorpayConnect, isConnecting };
};