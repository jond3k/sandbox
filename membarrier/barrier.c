#include "barrier.h"

int barrier_deactivate(struct barrier* barrier)
{
    printf("%x : deactivating memory barrier\n", barrier_threadid());
    if(mprotect(barrier->start, barrier->size-1, barrier->original_prot) != 0) {
        barrier_error_en(errno, "mprotect");
    }   

    // threads that are woken up can now continue
    barrier->locked = 0;

    int i;

    // unlock the wait_sem, waking any stopped worker threads one at a time
    for(i = 0; i < barrier->waiting; i++) {
        sem_post(&barrier->wait_sem);
    }

    printf("%x : woke up %d threads\n", barrier_threadid(), i);
    barrier->waiting = 0;
}

int barrier_activate(struct barrier* barrier)
{
    barrier->locked = 1;

    printf("%x : activating memory barrier for %p\n", barrier_threadid(), barrier->start);
    if(mprotect(barrier->start, barrier->size - 1, PROT_READ)) {
        barrier_error_en(errno, "mprotect");
    }
}

int barrier_init(struct barrier* barrier)
{
    if(barrier->original_prot == 0) {
        perror("original_prot not set");
        return -1;
    }

    if(barrier->size == 0) {
        perror("size not set");
        return -1;
    }

    if(barrier->start == 0) {
        perror("start not set");
        return -1;
    }

    sem_init(&barrier->wait_sem, 0, 0);
    barrierlist_add(barrier);
    segvhandler_attach();
}

int barrier_destroy(struct barrier* barrier)
{
    if(barrier->locked != 0) {
        barrier_deactivate(barrier);
    }
    segvhandler_detatch();
    barrierlist_remove(barrier);
}

int barrier_iswhitelisted(struct barrier* barrier, pthread_t thread)
{
    int i = 0, result = 0;
    pthread_t* whitelist = barrier->whitelist;

    while(whitelist[i] != 0) {
        if(whitelist[i] == thread) {
            result = 1;
            break;
        }
        i++;
    }
    return result;
}

unsigned int barrier_threadid()
{
    return (unsigned int)pthread_self();
}

