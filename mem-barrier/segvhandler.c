#include "segvhandler.h"

// FIXME: need a better way of doing this
volatile sig_atomic_t attached = 0;

void handle_segv(int sig, siginfo_t* siginfo, void* context)
{
    struct barrier* barrier = (struct barrier*) barrierlist_match(siginfo->si_addr);

    if(barrier != 0) {

        if(barrier_iswhitelisted(barrier, pthread_self())) {

            printf("%x : hit memory barrier %p; whitelisted\n", barrier_threadid(), barrier->start);

        } else {

            printf("%x : hit memory barrier %p\n", barrier_threadid(), barrier->start);
            barrier->waiting++;

            // wait until we're woken up
            while(barrier->locked && sem_wait(&barrier->wait_sem) != 0) {
                if(errno != EINTR) {
                    barrier_error_en(errno, "sem_wait");
                }   
                printf("%x : woken up by interrupt", barrier_threadid());
            }   
        }
    }   
}
                                                                                                                                  
void segvhandler_attach()
{
    // FIXME
    if(attached) 
        return;
    attached = 1;

    struct sigaction newact;
    newact.sa_flags = SA_SIGINFO;
    newact.sa_sigaction = &handle_segv;

    if(sigaction(SIGSEGV, &newact, NULL) != 0) {
        barrier_error_en(errno, "sigaction");
    }   

}

void segvhandler_detatch()
{
    // FIXME: not implemented
}

int segvhandler_isattached()
{
    return attached;
}

