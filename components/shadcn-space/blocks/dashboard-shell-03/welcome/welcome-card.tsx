import { Card, CardContent } from "@/components/ui/card";

const WelcomeCard = () => {
    return (
        <>
            <Card className="w-full bg-blue-500 relative py-6">
                <CardContent className="h-full px-6">
                    <div className="sm:w-3/5 w-full flex flex-col sm:items-start items-center gap-5">
                        <div >
                            <p className="text-white text-lg font-semibold">
                                Welcome Jonathan Deo
                            </p>

                            <p className="text-white/50 text-sm">Check all the statastics</p>
                        </div>

                        <div className="flex align-center rounded-lg justify-between bg-gray-950/10 w-fit">
                            <div className="py-3 px-4 text-center">
                                <h5 className="text-white text-lg font-bold">
                                    573
                                </h5>
                                <small className="text-white text-xs font-normal block">
                                    New Leads
                                </small>
                            </div>

                            <div className="py-3 px-4 text-center border-s border-white/20">
                                <h5 className="text-white text-lg font-bold">
                                    87%
                                </h5>
                                <small className="text-white text-xs font-normal block">
                                    Conversion
                                </small>
                            </div>
                        </div>
                    </div>

                    <img
                        src="https://images.shadcnspace.com/assets/backgrounds/make-social-media.png"
                        alt="background"
                        className="absolute bottom-0 right-5 sm:block hidden"
                        width={250}
                        height={173}
                    />
                </CardContent>
            </Card>
        </>
    );
};

export default WelcomeCard;
