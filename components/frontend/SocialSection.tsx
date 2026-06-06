'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

interface InstagramPost {
  id: string;
  username: string;
  avatar: string;
  location: string;
  image: string;
  likes: number;
  caption: string;
  isLiked?: boolean;
}

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const mockPosts: InstagramPost[] = [
  {
    id: '1',
    username: 'miattaqwa15.babelan',
    avatar: '/logomi.png',
    location: 'Babelan, Bekasi',
    image: '/images/flyer_eid.png',
    likes: 124,
    caption: 'Keluarga besar MIS AT-TAQWA 15 Babelan mengucapkan Selamat Hari Raya Idul Fitri 1447 H. Taqabbalallahu minna wa minkum, mohon maaf lahir dan batin. Semoga amal ibadah kita diterima oleh Allah SWT. 🌙✨',
  },
  {
    id: '2',
    username: 'miattaqwa15.babelan',
    avatar: '/logomi.png',
    location: 'Babelan, Bekasi',
    image: '/images/flyer_ppdb.png',
    likes: 218,
    caption: 'Penerimaan Peserta Didik Baru (PPDB) MI Attaqwa 15 Babelan Tahun Ajaran 2027/2028 resmi dibuka! Mari bergabung bersama kami mewujudkan generasi islami yang cerdas, berakhlak mulia, dan siap digital. Hubungi panitia PPDB untuk info lebih lanjut. 📝🎒',
  },
  {
    id: '3',
    username: 'miattaqwa15.babelan',
    avatar: '/logomi.png',
    location: 'Babelan, Bekasi',
    image: '/images/flyer_tryout.png',
    likes: 95,
    caption: 'Selamat menempuh Ujian Try Out bagi seluruh siswa kelas VI MI Attaqwa 15 Babelan. Tetap fokus, jujur, optimis, dan jangan lupa berdoa. Semoga mendapatkan hasil yang memuaskan dan berkah. Semangat! 💪🎓',
  },
];

export default function SocialSection() {
  const [posts, setPosts] = useState<InstagramPost[]>(mockPosts);

  const toggleLike = (id: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id === id) {
          const isLiked = !post.isLiked;
          return {
            ...post,
            isLiked,
            likes: isLiked ? post.likes + 1 : post.likes - 1,
          };
        }
        return post;
      })
    );
  };

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center flex flex-col items-center space-y-3 mb-16">
          <span className="font-body text-sm font-bold text-accent tracking-wider uppercase">
            Social Media
          </span>
          <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary">
            SOCIAL UPDATE MI ATTAQWA 15
          </h2>
          <div className="w-16 h-1 bg-primary rounded-full mt-2" />
        </div>

        {/* Instagram Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-100">
                    <Image
                      src={post.avatar}
                      alt={post.username}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body text-sm font-bold text-secondary">
                      {post.username}
                    </span>
                    <span className="font-body text-xs text-gray-400">
                      {post.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Image */}
              <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
                <Image
                  src={post.image}
                  alt="Social Post Flyer"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Card Actions */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-secondary">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`hover:text-red-500 transition-colors duration-200 ${
                        post.isLiked ? 'text-red-500 fill-red-500' : ''
                      }`}
                      aria-label="Suka"
                    >
                      <Heart className="w-6 h-6" />
                    </button>
                    <button className="hover:text-primary transition-colors duration-200" aria-label="Komentar">
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button className="hover:text-primary transition-colors duration-200" aria-label="Kirim">
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                  <button className="text-secondary hover:text-primary transition-colors duration-200" aria-label="Simpan">
                    <Bookmark className="w-6 h-6" />
                  </button>
                </div>

                {/* Likes count */}
                <span className="font-body text-sm font-bold text-secondary">
                  {post.likes.toLocaleString()} likes
                </span>

                {/* Caption text */}
                <p className="font-body text-sm text-gray-600 leading-relaxed">
                  <span className="font-bold text-secondary mr-2">{post.username}</span>
                  {post.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Visit Instagram Button */}
        <div className="flex justify-center">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-body text-base font-bold text-white bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-lg shadow-purple-500/10 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0"
          >
            <InstagramIcon className="w-5 h-5 mr-2.5" />
            Kunjungi Instagram Kami
          </a>
        </div>

      </div>
    </section>
  );
}
