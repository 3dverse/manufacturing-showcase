const RefreshNotifier = ({ refreshRate }: { refreshRate: number }) => {
    return (
        <div className="relative w-3 h-3 bg-brand/20">
            <span
                className="block absolute left-0 bottom-0 w-full h-full bg-brand origin-bottom animate-[refresh-notifier_2s_ease-in_infinite]"
                style={{
                    animationDuration: `${refreshRate}ms`,
                }}
            />
        </div>
    );
};

export default RefreshNotifier;
