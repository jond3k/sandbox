#ifndef BARRIER_H
#define BARRIER_H

#define _GNU_SOURCE

#include <pthread.h>
#include <signal.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <errno.h>
#include <semaphore.h> 
#include <assert.h>

/**
 * Descriptor for a memory barrier.
 * Changing this after calling barrier_init leads to undefined behaviour
 */
struct barrier {

    /**
     * The start of the segment
     */
    char* start;

    /**
     * The size of the segment
     */
    size_t size;

    /**
     * True when locked
     */
    sig_atomic_t locked;

    /**
     * The semaphore to use for signalling
     */
    sem_t wait_sem;

    /**
     * The number of threads that need to be woken up. We can't guarantee sem_getvalue() works
     */
    sig_atomic_t waiting;

    /**
     * The original protection property
     */
    int original_prot;

    /**
     * A null-terminated array of threads that are immune to the barrier effect
     */
    pthread_t* whitelist;
};

/**
 * Unlock the segment and wake all sleeping threads
 */
void barrier_deactivate(struct barrier* barrier);

/**
 * Lock the segment, blocking anyone who tries to use it
 */
void barrier_activate(struct barrier* barrier);

/**
 * Initialize a new memory barrier
 */
int barrier_init(struct barrier* barrier);

/**
 * Clean up any internal resources used by the memory barrier
 * Potential race condition: A thread is handling its segfault but the barrier has been removed. In this condition a normal segfault will be raised, killing the thread.
 * The solution is to not destroy barriers immidiately after they have been used
 */
void barrier_destroy(struct barrier* barrier);

/**
 * Return 1 if this thread has been whitelisted. This means it can skip the barrier.
 * Note that there is a significant performance penalty with this as every access will trigger a segfault!
 */
int barrier_iswhitelisted(struct barrier* barrier, pthread_t thread);

/**
 * Get a printable thread ID for use in logs
 */
unsigned int barrier_threadid();

#define barrier_error_en(en, msg) \
    do { errno = en; perror(msg); exit(EXIT_FAILURE); } while (0)

#define barrier_error(msg) \
    do { perror(msg); exit(EXIT_FAILURE); } while (0)


#endif

